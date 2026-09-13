<?php

namespace App\Http\Controllers;

use App\Models\EzFunnel;
use App\Models\EzFunnelField;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Themecollection;
use App\Models\ThemePurchase;
use App\Models\HandlePurchase;
use App\Models\Promotion;
use App\Models\Page;
use App\Models\Defaultpage;
use App\Models\WikiPage;
use App\Models\Frontpage;
use App\Models\UserBalance;
use App\Models\TempCustomdomain;
use App\Models\User;
use App\Models\Invoice;
use App\Helpers\IframeHelper;
use App\Models\Emaildesign;
use App\Models\TokenTransaction;
use App\Models\FunnelLogoSetting;
use App\Models\Admindomain;
use App\Models\Template;
use App\Models\TokenInfo;
use App\Models\FunnelSeoSetting;
use App\Models\Reserve;
use App\Models\Reaction;
use App\Models\EffectSetting;
use App\Models\Customdomain;
use App\Models\Domain;
use App\Models\Coupon;
use App\Models\StripeTransaction;
use App\Models\ReserveTransaction;
use App\Models\Tooltip;
use App\Models\Aiframe;
use App\Models\AiSetting;
use App\Models\AITooltip;
use App\Models\AISearchHistory;
use App\Models\AIUserSetting;
use App\Models\CouponUsage;
use App\Models\HomeTooltip;
use App\Models\PageGenerate;
use App\Services\InvoiceService;
use Carbon\Carbon;
use App\Models\Sell;
use App\Models\Powerstring;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Jenssegers\Agent\Agent;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Stripe\Stripe;
use Stripe\PaymentIntent;
use Stripe\PaymentMethod;
use Stripe\Exception\ApiErrorException;
use Illuminate\Support\Facades\DB;
use DOMDocument;
use DOMXPath;
use Spatie\ImageOptimizer\OptimizerChainFactory;
use Symfony\Component\DomCrawler\Crawler;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException; 
use Embed\Embed;
use Illuminate\Support\Facades\Mail;
use App\Mail\Eznew;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Session;
use Laravel\Socialite\Facades\Socialite;
use App\Services\HtmlParserService;
use Illuminate\Http\JsonResponse;


class WelcomeController extends Controller
{
	private $stripeSecretKey;
	private $aiSettings;
	
	public function __construct(private HtmlParserService $htmlParser)
	{
		$this->stripeSecretKey = config('services.stripe.secret');
		Stripe::setApiKey($this->stripeSecretKey);
		// Load AI settings once per request
		$this->loadAiSettings();
	}
	    /**
     * Load AI settings from database without caching
     */
    private function loadAiSettings(): void
    {
        // Always get fresh settings from database
        $this->aiSettings = AiSetting::getInstance();
    }
    
    /**
     * Get max characters based on authentication status
     */
    private function getMaxChars(): int
    {
        if (Auth::check()) {
            return $this->aiSettings->user_ai_enabled 
                ? $this->aiSettings->user_char_limit 
                : 0;
        }
        
        return $this->aiSettings->guest_ai_enabled 
            ? $this->aiSettings->guest_char_limit 
            : 0;
    }
    
    /**
     * Check if AI is enabled for current user
     */
    private function isAiEnabled(): bool
    {
        if (Auth::check()) {
            return $this->aiSettings->user_ai_enabled;
        }
        
        return $this->aiSettings->guest_ai_enabled;
    }
    
    /**
     * Get character limit message
     */
    private function getCharLimitMessage(): string
    {
        $maxChars = $this->getMaxChars();
        
        if (Auth::check()) {
            return "Query must be between 1 and {$maxChars} characters.";
        }
        
        return "Query must be between 1 and {$maxChars} characters. Please login for higher limits.";
    }
	
     public function index()
    {
		$fullDomain = idn_to_utf8(request()->getHost());
		$type = Frontpage::select('frontpages.*')
				->join('admindomains', 'frontpages.domain_id', '=', 'admindomains.id')
				->where('admindomains.domain', $fullDomain)
				->first();
		if($type->type=='AISEARCH'){
		$top = Aiframe::where('aiframes.type','TOP')->where('aiframes.status',1)
                ->join('admindomains', 'aiframes.domain_id', '=', 'admindomains.id')
                ->where('admindomains.domain', $fullDomain)
                ->get()
                ->map(function($item) {
                    return [
                        'id' => $item->id,
                        'content' => $item->content,
                        'type' => $item->type,
                        'status' => $item->status,
                    ];
                })
                ->toArray(); // Convert to array
                
        $bottom = Aiframe::where('aiframes.type','BOTTOM')->where('aiframes.status',1)
                ->join('admindomains', 'aiframes.domain_id', '=', 'admindomains.id')
                ->where('admindomains.domain', $fullDomain)
                ->get()
                ->map(function($item) {
                    return [
                        'id' => $item->id,
                        'content' => $item->content,
                        'type' => $item->type,
                        'status' => $item->status,
                    ];
                })
                ->toArray();
			$tooltips = HomeTooltip::getActiveTooltips();	
			$dayOfWeek = strtolower(Carbon::now()->format('D'));
			$domains = Admindomain::where('status', 'Active')
            ->where(function ($query) use ($dayOfWeek) {
                $query->where('days', 'all')
                    ->orWhere('days', 'LIKE', "%$dayOfWeek%");
            })
            ->orderBy('domain', 'ASC')
            ->get(['domain']);
			return Inertia::render('ezbar', [
			'topcontent' => $top,
			'bottomcontent' => $bottom,
			'domains' => $domains,
            'auth' => [
                'user' => auth()->user() ?? null
            ],
			'aiSettings' => $this->aiSettings,
			'tooltips' => $tooltips,
        ])->withViewData([
				'meta' => [
					'title' => 'The Ez Way To WiKi and Co-WiKi',
					'description' => 'The Ez Way To WiKi and Co-WiKi',
					'keywords' => 'ai',
					'siteurl' => 'https://ez.wiki',
					'sitename' => 'ez.wiki',
					'metalogo' => 'https://ez.wiki/ezlogo.png'
				],
				'favicon' => 'https://ez.wiki/ezlogo.png'
			]);
		}
		elseif($type->type=='THEME'){
        $frontpage = Frontpage::with(['template'])->find($type->id);
        
        // Get all templates in the specified order
        $templates = collect();
        
        if ($frontpage) {
            $themeIds = array_filter(array_map('trim', explode(',', $frontpage->theme_id)));
            
            foreach ($themeIds as $themeId) {
                $template = Template::find($themeId);
                if ($template) {
                    $templates->push($template);
                }
            }

            // Fallback to single template if no multiple templates found
            if ($templates->isEmpty() && $frontpage->theme_id) {
                $template = Template::find($frontpage->theme_id);
                if ($template) {
                    $templates->push($template);
                }
            }
        }

        // Prepare template data for frontend
        $templateData = $templates->map(function ($template) {
            return [
                'id' => $template->id,
                'user_id' => $template->user_id,
                'title' => $template->title,
                'description' => $template->description,
                'image' => $template->image,
                'option' => $template->option,
                'unique_id' => $template->unique_id,
                'created_at' => $template->created_at,
                'updated_at' => $template->updated_at,
            ];
        });

        return Inertia::render('welcome', [
            'template' => $templateData->first(), // For backward compatibility
            'allTemplates' => $templateData,      // All templates for slider
            'auth' => [
                'user' => Auth::user() ?? null
            ]
        ]);
		}
		else{
				$funnelData = EzFunnel::select('ez_funnels.*', 'ez_funnel_fields.*')
				->join('ez_funnel_fields', 'ez_funnels.id', '=', 'ez_funnel_fields.ez_funnel_id')
				->where('ez_funnels.id', $type->handle_id)
				->orderBy('ez_funnel_fields.position')
				->get();
				
			$funnel = $funnelData->first();
			$eyeTracking = $funnel ? $funnel->eye_tracking : 0;
			$visibility = $funnel ? $funnel->visibility : 0;
			$fly_sign = $funnel ? $funnel->fly_sign : 0;
			$designview = $funnel->designview ?? 'A';
			$mode = $funnel->mode ?? 'L';
			$color = $funnel->color ?? '#000000';
			$transparency = $funnel->transparency ?? '80';
			$token = $funnel->token;
			$hashtag = $funnel->seo_tag ?? '';
			// Handle multiple themes
			$themeIds = $funnel ? array_map('trim', explode(',', $funnel->theme)) : [];
			// Get all templates in the same order as themeIds
			$templates = collect();
			foreach ($themeIds as $themeId) {
				$template = Template::where('id', $themeId)->first();
				if ($template) {
					$templates->push($template);
				}
			}

			// If no templates found, try to get single template
			if ($templates->isEmpty() && $funnel) {
				$template = Template::where('id', $funnel->theme)->first();
				if ($template) {
					$templates->push($template);
				}
			}

			$effect = EffectSetting::where('ez_funnel_id', $funnel->ez_funnel_id)->get();
			
			$agent = new Agent();
			$sidebarwidth = 1;
			
			$contents = $funnelData->map(function($item) use (&$sidebarwidth, $agent) {
					// Skip items marked with 🚀 or 0️⃣
					if ($item->emoji_marker === '🚀' || $item->emoji_marker === '0️⃣') {
						// If emoji is 🚀, open URL in new tab if it exists
						if ($item->emoji_marker === '🚀' && !empty($item->url)) {
							echo "<script>window.open('{$item->url}', '_blank');</script>";
						}
						return null;
					}
					
					// Handle 🧨 emoji - extract URLs and open in multiple tabs
					if ($item->emoji_marker === '🧨' && !empty($item->url)) {
						// Extract URLs from the string - supports:
						// 1. Full URLs (http/https)
						// 2. Plain domains (google.com)
						// 3. Ignores @@ and other markers
						preg_match_all('/(https?:\/\/[^\s,]+)|((?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2})?(?:\/[^\s,]*)?)/', $item->url, $matches);
						
						// Combine both match groups and filter out empty values
						$urls = array_filter(array_merge($matches[1], $matches[2]));
						
						// Clean up URLs (remove trailing punctuation)
						$urls = array_map(function($url) {
							$url = trim($url, " ,.@");
							// Add http:// if it's a plain domain
							if (!preg_match('/^https?:\/\//i', $url)) {
								$url = 'http://' . $url;
							}
							return $url;
						}, $urls);
						
						if (!empty($urls)) {
							foreach ($urls as $url) {
								echo "<script>window.open('{$url}', '_blank');</script>";
							}
						}
						return null;
					}
					
					// Determine width based on emoji_marker
					$width = '30'; // default for emojis like 🔐,3️⃣,🧨
					
					switch ($item->emoji_marker) {
						case '1️⃣':
							$width = $item->custom_width-3;
							break;
						case '2️⃣':
							$width = '39';
							break;
						case '3️⃣':
							$width = '47';
							break;
						case '4️⃣':
							$width = '63';
							break;
						case '5️⃣':
							$width = '97';
							break;
					}
					
					if ($agent->isMobile() || $agent->isTablet()) {
						$width = '90';
					}
					
					if($sidebarwidth == 1 && $width != 97) {
						$sidebarwidth = 93 - $width;
					}
					
					$userData = null;
					if ($item->user_id) {
						$user = User::find($item->user_id);
						if ($user) {
							$userData = [
								'id' => $user->id,
								'name' => $user->name,
								'email' => $user->email,
								'profile_photo_url' => $user->profile_photo_url ?? null,
								'is_verified' => $user->email_verified_at !== null,
							];
						}
					}
					return [
						'id' => $item->id,
						'title' => $item->caption ?? '',
						'url' => $item->url ? str_replace('{timeago}', $item->created_at ? $item->created_at->diffForHumans() : '', $item->url) : '',
						'image_url' => $item->image_url,
						'link_url' => $item->link_url,
						'width' => $width.'%',
						'emoji_marker' => $item->emoji_marker,
						'pinned' => $item->pinned,
						'reference' => $item->reference,
						'user' => $userData,
						'created_at' => $item->created_at ? $item->created_at->toISOString() : null,
						'post_type' => $item->post_type
					];
				})->filter()->values()->all();
			
			$metaTitle = 'Ez way to WiKi and CoWiKi';
			$metaDescription = 'Ez.wiki';
			$metaKeywords = '';
			$metaSiteUrl = url()->current();
			$metaSiteName = 'ez.wiki';
			$metaLogo = 'https://ez.wiki/ezlogo.png';
			$favicon = 'https://ez.wiki/ezlogo.png';
			$qrcodelogo= 'https://ez.wiki/ezlogo.png';
			if ($funnel) {
				$seoSettings = FunnelSeoSetting::where('funnel_id', $funnel->ez_funnel_id)->first();   
				if ($seoSettings) {
					$metaTitle = $seoSettings->meta_title ?? $metaTitle;
					$metaDescription = $seoSettings->meta_description ?? $metaDescription;
					$metaKeywords = $seoSettings->meta_keywords ?? $metaKeywords;
					$metaSiteUrl = $seoSettings->meta_site_url ?? $metaSiteUrl;
					$metaSiteName = $seoSettings->meta_site_name ?? $metaSiteName;
					$metaLogo = $seoSettings->meta_logo ?? $metaLogo;
				}
				
				$logoSettings = FunnelLogoSetting::where('funnel_id', $funnel->ez_funnel_id)->first();
				if ($logoSettings) {
					if ($logoSettings->favicon_logo == 1) {
						$favicon = 'https://ez.wiki/'.$logoSettings->logoimage ?? $favicon;
					}
					if ($logoSettings->meta_logo == 1) {
						$metaLogo = 'https://ez.wiki/'.$logoSettings->logoimage ?? $metaLogo;
					}
					if ($logoSettings->fly_sign_logo == 1 && $effect->isNotEmpty()) {
						$effect->first()->moving_effect = 'none';
						$effect->first()->avatar_link = 'https://ez.wiki/'.$logoSettings->logoimage;
					}
					$qrcodelogo= 'https://ez.wiki/'.$logoSettings->logoimage ?? $qrcodelogo;
				}
			}
			$effect = $effect->isEmpty() ? null : $effect;
			$count = count($contents);
			$tooltips = Tooltip::all()->pluck('tooltips', 'reference');
			return Inertia::render('welcomepreviewez', [
				'contents' => $contents ?? [],
				'template' => $templates->first(), // For backward compatibility
				'allTemplates' => $templates,      // Send all templates for slider
				'funnel' => $token,
				'hashtagseo' => $hashtag,
				'eye_tracking' => $eyeTracking,
				'visibility' => $visibility,
				'fly_sign' => $fly_sign,
				'designview' => $designview,
				'mode' => $mode,
				'count' => $count,
				'tooltips' => $tooltips,
				'sidebarwidth' => $sidebarwidth.'%',
				'effect' => $effect,
				'color' => $color,
				'transparency' => $transparency,
				'qrcodelogo' => $qrcodelogo,
				'domainname' => $fullDomain,
				'auth' => [
					'user' => auth()->user() ?? null
				]
			])->withViewData([
				'meta' => [
					'title' => $metaTitle,
					'description' => $metaDescription,
					'keywords' => $metaKeywords,
					'siteurl' => $metaSiteUrl,
					'sitename' => $metaSiteName,
					'metalogo' => $metaLogo
				],
				'favicon' => $favicon
			]);
		}
    }
	
	public function aihome()
	{
		$fullDomain='ez.wiki';
		$top = Aiframe::where('aiframes.type','TOP')->where('aiframes.status',1)
                ->join('admindomains', 'aiframes.domain_id', '=', 'admindomains.id')
                ->where('admindomains.domain', $fullDomain)
                ->get()
                ->map(function($item) {
                    return [
                        'id' => $item->id,
                        'content' => $item->content,
                        'type' => $item->type,
                        'status' => $item->status,
                    ];
                })
                ->toArray(); // Convert to array
                
        $bottom = Aiframe::where('aiframes.type','BOTTOM')->where('aiframes.status',1)
                ->join('admindomains', 'aiframes.domain_id', '=', 'admindomains.id')
                ->where('admindomains.domain', $fullDomain)
                ->get()
                ->map(function($item) {
                    return [
                        'id' => $item->id,
                        'content' => $item->content,
                        'type' => $item->type,
                        'status' => $item->status,
                    ];
                })
                ->toArray();
			$tooltips = HomeTooltip::getActiveTooltips();		
			return Inertia::render('ezbar', [
			'topcontent' => $top,
			'bottomcontent' => $bottom,
            'auth' => [
                'user' => auth()->user() ?? null
            ],
			'aiSettings' => $this->aiSettings,
			'tooltips' => $tooltips,
        ])->withViewData([
				'meta' => [
					'title' => 'The Ez Way To WiKi and Co-WiKi',
					'description' => 'The Ez Way To WiKi and Co-WiKi',
					'keywords' => 'ai',
					'siteurl' => 'https://ez.wiki',
					'sitename' => 'ez.wiki',
					'metalogo' => 'https://ez.wiki/ezlogo.png'
				],
				'favicon' => 'https://ez.wiki/ezlogo.png'
			]);
	}
	
	public function editTheme($themeId)
{
    $template = Frontpage::where('frontpages.id', 1)
        ->join('templates', 'frontpages.theme_id', '=', 'templates.id')
        ->select('templates.*')
        ->first();

    $theme = Template::where('unique_id', $themeId)->firstOrFail();

    // Verify the user owns this theme (or is admin)
    if ($theme->user_id !== auth()->id() && !auth()->user()->isAdmin()) {
        abort(403, 'Unauthorized action');
    }
	
	$perPage = 8;
        
        // Get user's theme collection if authenticated
        $themecollection = [];
        $alltheme = [];
        $hasMoreThemes = false;
        $hasMoreCollection = false;
        
        if (auth()->check()) {
            // Theme Collection (purchased themes)
            $themecollectionQuery = Themecollection::where('themecollections.user_id', auth()->id())
                ->join('templates', 'themecollections.theme_id', '=', 'templates.id')
                ->select('templates.*')->orderBy('templates.created_at', 'desc');
                
            $themecollectionTotal = $themecollectionQuery->count();
            $themecollection = $themecollectionQuery->limit($perPage)->get()->toArray();
            $hasMoreCollection = $themecollectionTotal > count($themecollection);

            // User's own themes
            $allthemeQuery = Template::where('user_id', auth()->id())->orderBy('created_at', 'desc');
            $allthemeTotal = $allthemeQuery->count();
            $alltheme = $allthemeQuery->limit($perPage)->get()->toArray();
            $hasMoreThemes = $allthemeTotal > count($alltheme);
        }
        
        return Inertia::render('eztheme', [
            'template' => $template,
            'themecollection' => $themecollection,
			'editingTheme' => $theme,
            'alltheme' => $alltheme,
            'hasMoreThemes' => $hasMoreThemes,
            'hasMoreCollection' => $hasMoreCollection,
            'auth' => [
                'user' => auth()->user() ?? null
            ]
        ]);
}
	
	public function ezhandle()
{
    $template = Frontpage::where('frontpages.id', 1)
        ->join('templates', 'frontpages.theme_id', '=', 'templates.id')
        ->select('templates.*')
        ->first();
    
    // Get user's funnels with pagination
    $funnels = EzFunnel::where('user_id', auth()->id())
        ->with(['fields', 'customDomains'])
		->with(['fields', 'handleDomains'])
        ->orderBy('created_at', 'desc')
        ->paginate(10);

    // Debug the data structure being sent to frontend
    logger('Funnels data:', [
        'first_funnel' => $funnels->first() ? $funnels->first()->toArray() : null,
        'custom_domains_count' => $funnels->first() ? $funnels->first()->customDomains->count() : 0,
		'handle_domains_count' => $funnels->first() ? $funnels->first()->handleDomains->count() : 0
    ]);
	
	$dayOfWeek = strtolower(Carbon::now()->format('D'));
	$domains = Admindomain::where('status', 'Active')
						->where(function ($query) use ($dayOfWeek) {
							$query->where('days', 'all') // Show domains for all days
								->orWhere('days', 'LIKE', "%$dayOfWeek%"); // Show domains for the current day
						})
						->orderBy('domain', 'ASC')
						->get(['domain']);
	$tokenInfo = TokenInfo::first();
	$promoprice=0;
    return Inertia::render('ezhandle', [
        'template' => $template,
        'auth' => [
            'user' => auth()->user() ?? null
        ],
		'tokenInfo' => $tokenInfo,
        'initialFunnels' => $funnels,
		'domains' => $domains,
		'promoprice' => $promoprice
    ]);
	}
	
	public function funnel($funnelid)
{
	/*marketplace code */
	$query = [
            'min_price' => '',
            'max_price' => '',
            'search' => '',
        ];

        $template = Frontpage::where('frontpages.id', 1)
                ->join('templates', 'frontpages.theme_id', '=', 'templates.id')
                ->select('templates.*')
                ->first();

        // Main query with pagination
			$sellsQuery = Sell::with([
			'handleDomain' => function($q) {
				$q->select(['id', 'user_id', 'domain', 'domainselected', 'hashtag', 'email'])
				  ->whereNotExists(function($query) {
					  $query->select(DB::raw(1))
							->from('pending_domain_transfers')
							->whereColumn('pending_domain_transfers.domain_id', 'domains.id')
							->where('pending_domain_transfers.domain_type', 'DOMAIN')
							->where('pending_domain_transfers.status', 'pending');
				  });
			},
			'customDomain' => function($q) {
				$q->select(['id', 'user_id', 'domain', 'domainselected', 'hashtag', 'email'])
				  ->whereNotExists(function($query) {
					  $query->select(DB::raw(1))
							->from('pending_domain_transfers')
							->whereColumn('pending_domain_transfers.domain_id', 'customdomains.id')
							->where('pending_domain_transfers.domain_type', 'CUSTOM')
							->where('pending_domain_transfers.status', 'pending');
				  });
			},
			'handleDomain.user',
			'customDomain.user'
			])
			->where('price', '>', 0) // Add this line to exclude free listings
			->where(function($q) use ($query) {
			// Price filters
			if ($query['min_price']) {
				$q->where('price', '>=', $query['min_price']);
			}
			if ($query['max_price']) {
				$q->where('price', '<=', $query['max_price']);
			}
			})
            ->where(function($q) use ($query) {
                // Search filters
                if ($query['search']) {
                    $q->whereHas('handleDomain', function($q) use ($query) {
                        $q->where('domain', 'like', '%'.$query['search'].'%')
                          ->orWhere('domainselected', 'like', '%'.$query['search'].'%')
                          ->orWhere('hashtag', 'like', '%'.$query['search'].'%');
                    })
                    ->orWhereHas('customDomain', function($q) use ($query) {
                        $q->where('domain', 'like', '%'.$query['search'].'%')
                          ->orWhere('domainselected', 'like', '%'.$query['search'].'%')
                          ->orWhere('hashtag', 'like', '%'.$query['search'].'%');
                    });
                }
            })
            ->orderBy('created_at', 'desc');

        $sells = $sellsQuery->paginate(10);

        // Transform data for frontend
        $domains = [];
        foreach ($sells as $sell) {
            if ($sell->type === 'CUSTOM' && $sell->customDomain) {
                $domains[] = [
                    'id' => $sell->customDomain->id,
                    'domain' => $sell->customDomain->domain,
                    'domainselected' => $sell->customDomain->domainselected,
                    'hashtag' => $sell->customDomain->hashtag,
                    'email' => $sell->customDomain->email,
                    'type' => 'CUSTOM',
                    'sells' => [[
                        'price' => $sell->price,
                        'created_at' => $sell->created_at
                    ]],
                    'user' => $sell->customDomain->user
                        ? ['id' => $sell->customDomain->user->id, 'email' => $sell->customDomain->user->email]
                        : null
                ];
            } elseif ($sell->type === 'DOMAIN' && $sell->handleDomain) {
                $domains[] = [
                    'id' => $sell->handleDomain->id,
                    'domain' => $sell->handleDomain->domain,
                    'domainselected' => $sell->handleDomain->domainselected,
                    'hashtag' => $sell->handleDomain->hashtag,
                    'email' => $sell->handleDomain->email,
                    'type' => 'DOMAIN',
                    'sells' => [[
                        'price' => $sell->price,
                        'created_at' => $sell->created_at
                    ]],
                    'user' => $sell->handleDomain->user
                        ? ['id' => $sell->handleDomain->user->id, 'email' => $sell->handleDomain->user->email]
                        : null
                ];
            }
        }
    /*funnel data */
	$funnelData = EzFunnel::select('ez_funnels.*', 'ez_funnel_fields.*')
					->join('ez_funnel_fields', 'ez_funnels.id', '=', 'ez_funnel_fields.ez_funnel_id')
					->where('ez_funnels.token', $funnelid)
					->orderBy('ez_funnel_fields.position')
					->get();
        
    $funnel = $funnelData->first();
    if(empty($funnel)) {
        $servername = idn_to_utf8($_SERVER['HTTP_HOST']);
        $customdomain = Customdomain::whereRaw('BINARY `domain` = ?', [$funnelid])->where('domainselected', $servername)->first();
        
        if(!empty($customdomain)) {
            	$funnelData = EzFunnel::select('ez_funnels.*', 'ez_funnel_fields.*')
					->join('ez_funnel_fields', 'ez_funnels.id', '=', 'ez_funnel_fields.ez_funnel_id')
					->where('ez_funnels.id', $customdomain->funnelid)
					->orderBy('ez_funnel_fields.position')
					->get();
            $funnel = $funnelData->first();
        }
    }
	if(empty($funnel)) {
		$length = mb_strlen($funnelid, 'UTF-8');

		function detectChineseInString($string) {
			$chinesePattern = '/[\x{4E00}-\x{9FFF}\x{3400}-\x{4DBF}\x{F900}-\x{FAFF}]/u';
			return preg_match($chinesePattern, $string) ? 'chinese' : 'other';
		}

		// Check if it's a Chinese subdomain
		$isChineseSubdomain = detectChineseInString($funnelid);

		if ($isChineseSubdomain == 'chinese' && $length==1) {
			// URL encode the Chinese character for safe URL usage
			$encodedCharacter = urlencode($funnelid);
			$url = "https://hanziyuan.net/#" . $funnelid;
			// Redirect to the specified page with the Chinese character
			echo '<script type="text/javascript">
						window.open("' . addslashes($url) . '", "_blank", "width=800,height=600,resizable=yes,scrollbars=yes,location=yes");
					</script>';
			// Make sure to stop script execution after redirect
		}
		$fullDomain = request()->getHost();
		$servername = idn_to_utf8(substr(strstr($fullDomain, '.'), 1));
		$template = Frontpage::where('frontpages.id', 1)
			->join('templates', 'frontpages.theme_id', '=', 'templates.id')
			->select('templates.*')
			->first();
		
		$dayOfWeek = strtolower(Carbon::now()->format('D'));
		$domains = Admindomain::where('status', 'Active')
			->where(function ($query) use ($dayOfWeek) {
				$query->where('days', 'all')
					->orWhere('days', 'LIKE', "%$dayOfWeek%");
			})
			->orderBy('domain', 'ASC')
			->get(['domain']);
		
		$tokenInfo = TokenInfo::first();
		$promoprice = 0;
		$tooltips = Tooltip::all()->pluck('tooltips', 'reference');
		// Get promotion message with coupon relationship
		$promotionmessage='';
		if($length<4)
		{
		$promotionmessage = Promotion::with('coupon')->where('id', 3)->first();
		}
		if($length>=4)
		{
		$promotionmessage = Promotion::with('coupon')->where('id', 4)->first();
		}
		
		// Extract coupon code if exists
		$defaultCouponCode = '';
		if ($promotionmessage && $promotionmessage->coupon) {
			$defaultCouponCode = $promotionmessage->coupon->coupon;
		}
		$clean_domain = preg_replace('/^www\./', '', $_SERVER['HTTP_HOST']);
		$codepage = Page::where('id',7)->value('code');
		return Inertia::render('offerhandle500', [
			'template' => $template,
			'auth' => [
				'user' => auth()->user() ?? null
			],
			'tokenInfo' => $tokenInfo,
			'domains' => $domains,
			'codepage' => $codepage,
			'subdomain' => $funnelid,
			'promoprice' => $promoprice,
			'tooltips' => $tooltips,
			'clean_domain' => $clean_domain,
			'promotionmessage' => $promotionmessage,
			'defaultCouponCode' => $defaultCouponCode, // Add this
			'checkDomainUrl' => url('/check-custom-domain'),
			'checkStandardDomainUrl' => url('/check-standard-domain')
		]);
		/*$wikiPage = WikiPage::where('id', 3)
            ->where('status', 'published')
            ->first();
		
        if (!$wikiPage) {
            abort(404, 'Wiki page not found');
        }
		
		$cleanHtml = html_entity_decode(str_replace("{brandhandle}", "ez.wiki/".$funnelid, $wikiPage->html_content));
		
		return response($cleanHtml)
            ->header('Content-Type', 'text/html');*/
	}
	if(!empty($funnel)){
		if($funnel->displaymode=='page')
		{
			$page = PageGenerate::where('id', $funnel->pageid)->firstOrFail();

            $restoredHtml = null;
            if (!empty($page->processed_html)) {
                $secretsJson = $page->getAttributes()['secrets'] ?? null;
                $restoredHtml = $this->htmlParser->renderPage($page->processed_html, $secretsJson);
            } elseif (!empty($page->html_content)) {
                $restoredHtml = $page->html_content;
            }
		$metaTitle = 'Ez way to WiKi and CoWiKi';
		$metaDescription = 'Ez.wiki';
		$metaKeywords = '';
		$metaSiteUrl = url()->current();
		$metaSiteName = 'ez.wiki';
		$metaLogo = 'https://ez.wiki/ezlogo.png';
		$favicon = 'https://ez.wiki/ezlogo.png';
		$qrcodelogo= 'https://ez.wiki/ezlogo.png';
		$effect = EffectSetting::where('ez_funnel_id', $funnel->ez_funnel_id)->get();
		if ($funnel) {
			$seoSettings = FunnelSeoSetting::where('funnel_id', $funnel->ez_funnel_id)->first();   
			if ($seoSettings) {
				$metaTitle = $seoSettings->meta_title ?? $metaTitle;
				$metaDescription = $seoSettings->meta_description ?? $metaDescription;
				$metaKeywords = $seoSettings->meta_keywords ?? $metaKeywords;
				$metaSiteUrl = $seoSettings->meta_site_url ?? $metaSiteUrl;
				$metaSiteName = $seoSettings->meta_site_name ?? $metaSiteName;
				$metaLogo = $seoSettings->meta_logo ?? $metaLogo;
			}
			
			$logoSettings = FunnelLogoSetting::where('funnel_id', $funnel->ez_funnel_id)->first();
			if ($logoSettings) {
				if ($logoSettings->favicon_logo == 1) {
					$favicon = 'https://ez.wiki/'.$logoSettings->logoimage ?? $favicon;
				}
				if ($logoSettings->meta_logo == 1) {
					$metaLogo = 'https://ez.wiki/'.$logoSettings->logoimage ?? $metaLogo;
				}
				if ($logoSettings->fly_sign_logo == 1 && $effect->isNotEmpty()) {
					$effect->first()->moving_effect = 'none';
					$effect->first()->avatar_link = 'https://ez.wiki/'.$logoSettings->logoimage;
				}
				$qrcodelogo= 'https://ez.wiki/'.$logoSettings->logoimage ?? $qrcodelogo;
			}
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
            ])->withViewData([
				'meta' => [
					'title' => $metaTitle,
					'description' => $metaDescription,
					'keywords' => $metaKeywords,
					'siteurl' => $metaSiteUrl,
					'sitename' => $metaSiteName,
					'metalogo' => $metaLogo
				],
				'favicon' => $favicon
			]);
		}
		if($funnel->displaymode=='ai')
		{
			$search = AISearchHistory::where('id', $funnel->aiid)->first();
			if (!$search) {
            if (request()->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'AI search not found',
                ], 404);
            }
            
            return redirect('/')->with('error', 'AI search not found');
        }
        
        // Get the first message to check conversation status
        $firstMessage = $search->getFirstMessage();
        $conversationStatus = $firstMessage ? $firstMessage->status : $search->status;
        
        // Check if guests can view this conversation
        $guestsAllowed = $this->canGuestsInteract($firstMessage);
        
        // Initialize variables with default values
        $guestInteractionDisabled = false;
        $requiresLogin = false;
        
        // Check if user has private access session (no expiry)
        $hasPrivateAccess = false;
        $sessionData = session('private_access_' . $firstMessage->conversation_id);
        if (!is_null($sessionData) && isset($sessionData['token'])) {
            $hasPrivateAccess = true;
        }
        
        // If conversation is private and user has private access session, allow viewing
        $isOwner = Auth::check() && $firstMessage && $firstMessage->user_id === Auth::id();
        $hasViewAccess = false;
        
        if ($conversationStatus === 'private') {
            if ($isOwner || $hasPrivateAccess) {
                $hasViewAccess = true;
                $requiresLogin = false;
                $guestInteractionDisabled = false;
            } else {
                $hasViewAccess = false;
                $requiresLogin = true;
                $guestInteractionDisabled = true;
            }
        } else {
            // For public conversations
            if ($firstMessage && $firstMessage->status === 'public' && !$guestsAllowed && !Auth::check()) {
                $guestInteractionDisabled = true;
                $requiresLogin = true;
                $hasViewAccess = false;
            } else {
                $hasViewAccess = true;
                $guestInteractionDisabled = false;
                $requiresLogin = false;
            }
        }
        
        // If user has access via private access, they can see all messages
        if ($hasPrivateAccess && $conversationStatus === 'private') {
            $guestInteractionDisabled = false;
            $requiresLogin = false;
        }
        
        AISearchHistory::ensureConversationPositions($search->conversation_id);
        // Get conversation messages with access filtering
        $conversationMessages = $this->getFilteredConversationMessages($search->conversation_id);
        
        // If user has private access, they should see all messages in the conversation
        if ($hasPrivateAccess && !$isOwner) {
            // Get all messages without filtering for private access users
            $conversationMessages = AISearchHistory::where('conversation_id', $search->conversation_id)->orderBy('position', 'asc')->orderBy('created_at', 'asc')
                ->get()
                ->filter(function ($message) use ($hasPrivateAccess, $isOwner) {
                    // For private access, show all non-hidden messages
                    if ($message->status === 'hidden' && !$isOwner) {
                        return false;
                    }
                    return true;
                })
                ->values();
        }
        
        // If it's an array, convert to Collection
        if (is_array($conversationMessages)) {
            $conversationMessages = collect($conversationMessages);
        }
        
        // Calculate conversation tokens and cost
        $conversationTokens = $conversationMessages->sum('total_tokens');
        $conversationCost = ($conversationTokens / 1000) * 0.01;
        
        // Get first message (for conversation context)
        $firstMessage = $search->getFirstMessage();
        
        // Get related searches (based on first message) - only public ones
        $relatedSearches = $firstMessage ? $firstMessage->getRelatedSearches(5) : collect();
        $relatedSearches = $relatedSearches->filter(function($related) {
            return $related->status === 'public';
        })->take(3);
        
        // Prepare the messages for response with IP address included
        $formattedMessages = $conversationMessages->map(function ($message) {
            return AISearchHistory::formatMessageForDisplay($message);
        });
        
        // Get all tooltips for AISearchView component
        $tooltips = AITooltip::where('component', 'AISearchView')
            ->orWhere('component', 'AI Search View')
            ->get()
            ->pluck('tooltips', 'reference')
            ->map(function($tooltip) {
                return is_array($tooltip) ? $tooltip[0] : (is_string($tooltip) ? json_decode($tooltip, true)[0] ?? $tooltip : $tooltip);
            })
            ->toArray();
        
        if (request()->expectsJson()) {
            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $search->id,
                    'slug' => $search->slug,
                    'conversation_id' => $search->conversation_id,
                    'thread_id' => $search->thread_id,
                    'conversation_title' => $search->conversation_title,
                    'message_role' => $search->message_role,
                    'content_type' => $search->content_type,
                    'query' => $search->query,
                    'response' => $search->response,
                    'sources' => $search->sources,
                    'usage' => $search->usage,
                    'thinking_enabled' => $search->thinking_enabled,
                    'model' => $search->model,
                    'temperature' => $search->temperature,
                    'max_tokens' => $search->max_tokens,
                    'finish_reason' => $search->finish_reason,
                    'created_at' => $search->created_at->toISOString(),
                    'created_at_formatted' => $search->created_at->format('M d, Y \a\t h:i A'),
                    'updated_at' => $search->updated_at->toISOString(),
                    'user' => $search->user ? [
                        'id' => $search->user->id,
                        'name' => $search->user->name,
                        'email' => $search->user->email,
                    ] : null,
					'landing_page_url' => $search->landing_page_url ?? null,
                    'status' => $search->status,
                    'share_url' => $search->getShareableUrl(),
                    'conversation_url' => $search->getConversationUrl(),
                    'total_tokens' => $search->total_tokens,
                    'conversation_tokens' => $conversationTokens,
                    'conversation_cost' => $conversationCost,
                ],
                'conversation_messages' => $formattedMessages,
                'message_count' => $conversationMessages->count(),
                'first_message' => $firstMessage ? [
                    'slug' => $firstMessage->slug,
                    'query' => $firstMessage->query,
                    'created_at' => $firstMessage->created_at->toISOString(),
                    'status' => $firstMessage->status,
                ] : null,
                'related' => $relatedSearches->map(function ($related) {
                    return [
                        'slug' => $related->slug,
                        'query' => $related->query,
                        'conversation_title' => $related->conversation_title,
                        'created_at' => $related->created_at->toISOString(),
                        'share_url' => $related->getShareableUrl(),
                        'message_count' => $related->message_count,
                        'status' => $related->status,
                    ];
                }),
                'guest_interaction_disabled' => $guestInteractionDisabled,
                'requires_login' => $requiresLogin,
                'has_private_access' => $hasPrivateAccess,
            ]);
        }
        
        $dayOfWeek = strtolower(Carbon::now()->format('D'));
        $domains = Admindomain::where('status', 'Active')
            ->where(function ($query) use ($dayOfWeek) {
                $query->where('days', 'all')
                    ->orWhere('days', 'LIKE', "%$dayOfWeek%");
            })
            ->orderBy('domain', 'ASC')
            ->get(['domain']);
        
        $tokenInfo = TokenInfo::first();
        $promoprice = 0;
        $metaTitle = 'Ez way to WiKi and CoWiKi';
		$metaDescription = 'Ez.wiki';
		$metaKeywords = '';
		$metaSiteUrl = url()->current();
		$metaSiteName = 'ez.wiki';
		$metaLogo = 'https://ez.wiki/ezlogo.png';
		$favicon = 'https://ez.wiki/ezlogo.png';
		$qrcodelogo= 'https://ez.wiki/ezlogo.png';
		$effect = EffectSetting::where('ez_funnel_id', $funnel->ez_funnel_id)->get();
		if ($funnel) {
			$seoSettings = FunnelSeoSetting::where('funnel_id', $funnel->ez_funnel_id)->first();   
			if ($seoSettings) {
				$metaTitle = $seoSettings->meta_title ?? $metaTitle;
				$metaDescription = $seoSettings->meta_description ?? $metaDescription;
				$metaKeywords = $seoSettings->meta_keywords ?? $metaKeywords;
				$metaSiteUrl = $seoSettings->meta_site_url ?? $metaSiteUrl;
				$metaSiteName = $seoSettings->meta_site_name ?? $metaSiteName;
				$metaLogo = $seoSettings->meta_logo ?? $metaLogo;
			}
			
			$logoSettings = FunnelLogoSetting::where('funnel_id', $funnel->ez_funnel_id)->first();
			if ($logoSettings) {
				if ($logoSettings->favicon_logo == 1) {
					$favicon = 'https://ez.wiki/'.$logoSettings->logoimage ?? $favicon;
				}
				if ($logoSettings->meta_logo == 1) {
					$metaLogo = 'https://ez.wiki/'.$logoSettings->logoimage ?? $metaLogo;
				}
				if ($logoSettings->fly_sign_logo == 1 && $effect->isNotEmpty()) {
					$effect->first()->moving_effect = 'none';
					$effect->first()->avatar_link = 'https://ez.wiki/'.$logoSettings->logoimage;
				}
				$qrcodelogo= 'https://ez.wiki/'.$logoSettings->logoimage ?? $qrcodelogo;
			}
		}
        return Inertia::render('AISearchView', [
            'tokenInfo' => $tokenInfo,
            'domains' => $domains,
            'promoprice' => $promoprice,
            'tooltips' => $tooltips,
            'checkDomainUrl' => url('/check-custom-domain'),
            'checkStandardDomainUrl' => url('/check-ezpressstandard-domain'),
            'aiSettings' => $this->aiSettings,
            'search' => [
                'id' => $search->id,
                'slug' => $search->slug,
                'conversation_id' => $search->conversation_id,
                'thread_id' => $search->thread_id,
                'conversation_title' => $search->conversation_title,
                'message_role' => $search->message_role,
                'content_type' => $search->content_type,
                'query' => $search->query,
                'response' => $search->response,
                'sources' => $search->sources,
                'usage' => $search->usage,
                'thinking_enabled' => $search->thinking_enabled,
                'model' => $search->model,
                'temperature' => $search->temperature,
                'max_tokens' => $search->max_tokens,
                'finish_reason' => $search->finish_reason,
                'created_at' => $search->created_at->toISOString(),
                'created_at_formatted' => $search->created_at->format('M d, Y \a\t h:i A'),
                'updated_at' => $search->updated_at->toISOString(),
                'share_url' => $search->getShareableUrl(),
                'conversation_url' => $search->getConversationUrl(),
                'total_tokens' => $search->total_tokens,
                'conversation_tokens' => $conversationTokens,
                'conversation_cost' => $conversationCost,
                'status' => $search->status,
				'landing_page_url' => $search->landing_page_url ?? null,
                'user' => $search->user ? [
                    'id' => $search->user->id,
                    'name' => $search->user->name,
                    'email' => $search->user->email,
                ] : null,
            ],
            'conversation_messages' => $formattedMessages,
            'message_count' => $conversationMessages->count(),
            'share_url' => $search->getShareableUrl(),
            'related_searches' => $relatedSearches->map(function ($related) {
                return [
                    'slug' => $related->slug,
                    'query' => $related->query,
                    'conversation_title' => $related->conversation_title,
                    'created_at' => $related->created_at->toISOString(),
                    'share_url' => $related->getShareableUrl(),
                    'message_count' => $related->message_count,
                    'status' => $related->status,
                ];
            }),
            'guestInteractionDisabled' => $guestInteractionDisabled,
            'requiresLogin' => $requiresLogin,
            'hasPrivateAccess' => $hasPrivateAccess,
        ])->withViewData([
				'meta' => [
					'title' => $metaTitle,
					'description' => $metaDescription,
					'keywords' => $metaKeywords,
					'siteurl' => $metaSiteUrl,
					'sitename' => $metaSiteName,
					'metalogo' => $metaLogo
				],
				'favicon' => $favicon
			]);
		}
	}
    $eyeTracking = $funnel ? $funnel->eye_tracking : 0;
	$visibility = $funnel ? $funnel->visibility : 0;
    $fly_sign = $funnel ? $funnel->fly_sign : 0;
	$designview = $funnel->designview ?? 'A';
    $mode = $funnel->mode ?? 'L';
    $color = $funnel->color ?? '#000000';
	$transparency = $funnel->transparency ?? '80';
	$token = $funnel->token;
	$displaymode = $funnel->displaymode;
	$hashtag = $funnel->seo_tag ?? '';
    // Handle multiple themes
    $themeIds = $funnel ? array_map('trim', explode(',', $funnel->theme)) : [];
    // Get all templates in the same order as themeIds
    $templates = collect();
    foreach ($themeIds as $themeId) {
        $template = Template::where('id', $themeId)->first();
        if ($template) {
            $templates->push($template);
        }
    }

    // If no templates found, try to get single template
    if ($templates->isEmpty() && $funnel) {
        $template = Template::where('id', $funnel->theme)->first();
        if ($template) {
            $templates->push($template);
        }
    }

    $effect = EffectSetting::where('ez_funnel_id', $funnel->ez_funnel_id)->get();
	
    $agent = new Agent();
    $sidebarwidth = 1;
    
    $contents = $funnelData->map(function($item) use (&$sidebarwidth, $agent) {
            // Skip items marked with 🚀 or 0️⃣
            if ($item->emoji_marker === '🚀' || $item->emoji_marker === '0️⃣') {
                // If emoji is 🚀, open URL in new tab if it exists
                if ($item->emoji_marker === '🚀' && !empty($item->url)) {
                    echo "<script>window.open('{$item->url}', '_blank');</script>";
                }
                return null;
            }
            
            // Handle 🧨 emoji - extract URLs and open in multiple tabs
            if ($item->emoji_marker === '🧨' && !empty($item->url)) {
				// Extract URLs from the string - supports:
				// 1. Full URLs (http/https)
				// 2. Plain domains (google.com)
				// 3. Ignores @@ and other markers
				preg_match_all('/(https?:\/\/[^\s,]+)|((?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2})?(?:\/[^\s,]*)?)/', $item->url, $matches);
				
				// Combine both match groups and filter out empty values
				$urls = array_filter(array_merge($matches[1], $matches[2]));
				
				// Clean up URLs (remove trailing punctuation)
				$urls = array_map(function($url) {
					$url = trim($url, " ,.@");
					// Add http:// if it's a plain domain
					if (!preg_match('/^https?:\/\//i', $url)) {
						$url = 'http://' . $url;
					}
					return $url;
				}, $urls);
				
				if (!empty($urls)) {
					foreach ($urls as $url) {
						echo "<script>window.open('{$url}', '_blank');</script>";
					}
				}
				return null;
			}
            
            // Determine width based on emoji_marker
            $width = '30'; // default for emojis like 🔐,3️⃣,🧨
            
            switch ($item->emoji_marker) {
                case '1️⃣':
                    $width = $item->custom_width-3;
                    break;
                case '2️⃣':
                    $width = '39';
                    break;
                case '3️⃣':
                    $width = '47';
                    break;
				case '4️⃣':
                    $width = '63';
                    break;
				case '5️⃣':
                    $width = '97';
                    break;
            }
            
            if ($agent->isMobile() || $agent->isTablet()) {
                $width = '90';
            }
            
            if($sidebarwidth == 1 && $width != 97) {
                $sidebarwidth = 93 - $width;
            }
			
            $userData = null;
            if ($item->user_id) {
                $user = User::find($item->user_id);
                if ($user) {
                    $userData = [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'profile_photo_url' => $user->profile_photo_url ?? null,
                        'is_verified' => $user->email_verified_at !== null,
                    ];
                }
            }
            return [
                'id' => $item->id,
                'title' => $item->caption ?? '',
                'url' => $item->url ? str_replace('{timeago}', $item->created_at ? $item->created_at->diffForHumans() : '', $item->url) : '',
				'image_url' => $item->image_url,
				'link_url' => $item->link_url,
                'width' => $width.'%',
				'emoji_marker' => $item->emoji_marker,
				'pinned' => $item->pinned,
				'reference' => $item->reference,
				'user' => $userData,
				'created_at' => $item->created_at ? $item->created_at->toISOString() : null,
                'post_type' => $item->post_type
            ];
        })->filter()->values()->all();
    
    $metaTitle = 'Ez way to WiKi and CoWiKi';
    $metaDescription = 'Ez.wiki';
    $metaKeywords = '';
    $metaSiteUrl = url()->current();
    $metaSiteName = 'ez.wiki';
    $metaLogo = 'https://ez.wiki/ezlogo.png';
    $favicon = 'https://ez.wiki/ezlogo.png';
    $qrcodelogo= 'https://ez.wiki/ezlogo.png';
    if ($funnel) {
        $seoSettings = FunnelSeoSetting::where('funnel_id', $funnel->ez_funnel_id)->first();   
        if ($seoSettings) {
            $metaTitle = $seoSettings->meta_title ?? $metaTitle;
            $metaDescription = $seoSettings->meta_description ?? $metaDescription;
            $metaKeywords = $seoSettings->meta_keywords ?? $metaKeywords;
            $metaSiteUrl = $seoSettings->meta_site_url ?? $metaSiteUrl;
            $metaSiteName = $seoSettings->meta_site_name ?? $metaSiteName;
            $metaLogo = $seoSettings->meta_logo ?? $metaLogo;
        }
        
        $logoSettings = FunnelLogoSetting::where('funnel_id', $funnel->ez_funnel_id)->first();
        if ($logoSettings) {
            if ($logoSettings->favicon_logo == 1) {
                $favicon = 'https://ez.wiki/'.$logoSettings->logoimage ?? $favicon;
            }
            if ($logoSettings->meta_logo == 1) {
                $metaLogo = 'https://ez.wiki/'.$logoSettings->logoimage ?? $metaLogo;
            }
            if ($logoSettings->fly_sign_logo == 1 && $effect->isNotEmpty()) {
                $effect->first()->moving_effect = 'none';
                $effect->first()->avatar_link = 'https://ez.wiki/'.$logoSettings->logoimage;
            }
			$qrcodelogo= 'https://ez.wiki/'.$logoSettings->logoimage ?? $qrcodelogo;
        }
    }
    $effect = $effect->isEmpty() ? null : $effect;
	$count = count($contents);
	$tooltips = Tooltip::all()->pluck('tooltips', 'reference');
    return Inertia::render('previewez', [
        'contents' => $contents ?? [],
        'template' => $templates->first(), // For backward compatibility
        'allTemplates' => $templates,      // Send all templates for slider
        'funnel' => $token,
		'hashtagseo' => $hashtag,
        'eye_tracking' => $eyeTracking,
		'visibility' => $visibility,
        'fly_sign' => $fly_sign,
		'designview' => $designview,
        'mode' => $mode,
        'count' => $count,
        'sidebarwidth' => $sidebarwidth.'%',
        'effect' => $effect,
		'color' => $color,
		'displaymode' => $displaymode,
		'transparency' => $transparency,
		'qrcodelogo' => $qrcodelogo,
		'domains' => $domains,
        'filters' => $query,
		'pagination' => [
                'current_page' => $sells->currentPage(),
                'last_page' => $sells->lastPage(),
                'per_page' => $sells->perPage(),
                'total' => $sells->total(),
            ],
		'tooltips' => $tooltips,
        'auth' => [
			'user' => auth()->user() ? [
				'id' => auth()->user()->id,
				'name' => auth()->user()->name,
				'email' => auth()->user()->email,
				'bee_points_balance' => auth()->user()->balance->bee_points_balance ?? 0,
			] : null
		]
    ])->withViewData([
        'meta' => [
            'title' => $metaTitle,
            'description' => $metaDescription,
            'keywords' => $metaKeywords,
            'siteurl' => $metaSiteUrl,
            'sitename' => $metaSiteName,
            'metalogo' => $metaLogo
        ],
        'favicon' => $favicon
    ]);
}
	
	public function createez()
    {
		$template = Frontpage::where('frontpages.id', 1)
            ->join('templates', 'frontpages.theme_id', '=', 'templates.id')
            ->select('templates.*')
            ->first();
		
        return Inertia::render('createez', [
            'template' => $template,
            'auth' => [
                'user' => auth()->user() ?? null
            ]
        ]);
    }
	
	public function preview($themeId)
    {
		$template = Template::where('unique_id','T'.$themeId)->first();
		
        return Inertia::render('previewtheme', [
            'template' => $template,
            'auth' => [
                'user' => auth()->user() ?? null
            ]
        ]);
    }
	
	public function eztheme(Request $request)
    {
        // Get the main template for frontpage ID 1
        $template = Frontpage::where('frontpages.id', 1)
            ->join('templates', 'frontpages.theme_id', '=', 'templates.id')
            ->select('templates.*')
            ->first();

        // Initial load with 8 items per collection
        $perPage = 8;
        
        // Get user's theme collection if authenticated
        $themecollection = [];
        $alltheme = [];
        $hasMoreThemes = false;
        $hasMoreCollection = false;
        
        if (auth()->check()) {
            // Theme Collection (purchased themes)
            $themecollectionQuery = Themecollection::where('themecollections.user_id', auth()->id())
                ->join('templates', 'themecollections.theme_id', '=', 'templates.id')
                ->select('templates.*')->orderBy('templates.created_at', 'desc');;
                
            $themecollectionTotal = $themecollectionQuery->count();
            $themecollection = $themecollectionQuery->limit($perPage)->get()->toArray();
            $hasMoreCollection = $themecollectionTotal > count($themecollection);

            // User's own themes
            $allthemeQuery = Template::where('user_id', auth()->id())->orderBy('created_at', 'desc');
            $allthemeTotal = $allthemeQuery->count();
            $alltheme = $allthemeQuery->limit($perPage)->get()->toArray();
            $hasMoreThemes = $allthemeTotal > count($alltheme);
        }
        
        return Inertia::render('eztheme', [
            'template' => $template,
            'themecollection' => $themecollection,
            'alltheme' => $alltheme,
            'hasMoreThemes' => $hasMoreThemes,
            'hasMoreCollection' => $hasMoreCollection,
            'auth' => [
                'user' => auth()->user() ?? null,
				'linkedin_access_token' => auth()->user() ? auth()->user()->linkedin_access_token : null,
				'reddit_token' => auth()->user() ? auth()->user()->reddit_token : null,
            ]
        ]);
    }
	
	public function searchThemes(Request $request)
{
    $request->validate([
        'q' => 'required|string|min:2'
    ]);

    $searchTerm = $request->q;
    
    $themes = Template::where('user_id', auth()->id())
        ->where(function($query) use ($searchTerm) {
            $query->where('title', 'like', "%{$searchTerm}%")
                  ->orWhere('description', 'like', "%{$searchTerm}%")
                  ->orWhere('unique_id', 'like', "%{$searchTerm}%");
        })
        ->orderBy('created_at', 'desc')
        ->limit(20)
        ->get();

    return response()->json([
        'themes' => $themes
    ]);
}

    public function loadMore(Request $request)
    {
        $request->validate([
            'type' => 'required|in:collection,themes',
            'page' => 'required|integer|min:1'
        ]);

        $perPage = 8;
        $offset = ($request->page - 1) * $perPage;

        if ($request->type === 'collection') {
            $query = Themecollection::where('themecollections.user_id', auth()->id())
                ->join('templates', 'themecollections.theme_id', '=', 'templates.id')
                ->select('templates.*')->orderBy('templates.created_at', 'desc');
        } else {
            $query = Template::where('user_id', auth()->id())->orderBy('created_at', 'desc');
        }

        $total = $query->count();
        $themes = $query->offset($offset)
                       ->limit($perPage)
                       ->get()
                       ->toArray();

        return response()->json([
            'themes' => $themes,
            'hasMore' => ($offset + count($themes)) < $total
        ]);
    }
	
	public function store(Request $request)
{
    $request->validate([
        'title' => 'required|string|max:255'
    ]);
    
    $themeData = [
        'user_id' => auth()->id(),
        'title' => $request->title,
        'description' => $request->description,
        'price' => $request->price ?? 0,
		'leftwidth' => $request->leftwidth ?? 0,
		'rightwidth' => $request->rightwidth ?? 0,
        'option' => $request->option,
		'bgcolour' => $request->bgcolour,
        'status' => 'active' // default status
    ];
	function get_domain($url)
		{
			if (empty($url)) {
				return false;
			}
			
			$host = parse_url($url, PHP_URL_HOST);
			if (!$host) {
				return false;
			}
			
			// Remove www. prefix
			$domain = preg_replace('/^www\./', '', $host);
			
			// Basic domain validation
			if (filter_var($domain, FILTER_VALIDATE_DOMAIN, FILTER_FLAG_HOSTNAME)) {
				return $domain;
			}
			
			return false;
		}
		function printText(?string $text)
		{
			if ($text) {
			return htmlspecialchars($text, ENT_IGNORE);
			}
		}
		function isCSS($text) {
		$pattern = '/\.[a-zA-Z0-9_-]+{[^}]*}/';
		if (preg_match($pattern, $text)) {
			return false;
		}
		return true;
		}
		function printImage(?string $image)
		{
			if ($image) {
			return '<img src="'.$image.'" width="100%" >';
			}else
			{
				return '<img src="/bee.webp" width="100%" >';
			}
		}
		function printfav(?string $image)
		{
			if ($image) {
			   return '<img src="'.$image.'" width="36px" >';
			}
			return null;
		}
		
		function random_color_part() {
		 return str_pad( dechex( mt_rand( 0, 255 ) ), 2, '0', STR_PAD_LEFT);
		}

		function random_color() {
		 return random_color_part() . random_color_part() . random_color_part();
		}
	if ($request->hasFile('file')) {
            $image = $request->file('file');
            $imageName = time() . '_.' . $image->getClientOriginalExtension();
            $destinationPath = public_path('template_pic');
            
            if (!file_exists($destinationPath)) {
                mkdir($destinationPath, 0755, true);
            }
            
            $image->move($destinationPath, $imageName);
            $themeData['image'] = 'template_pic/' . $imageName;
        } else {
			$done='';
			$aladinurlredirectembed='';
			if(isset($request->url)){
		$parse = explode('/',$request->url);
		if(isset($parse[3])){
			$linkdomain=$parse[0].'//'.$parse[2].'/';
			$search=$parse[3];
			$urlnew=$request->url;
			if('tiktok.com'==get_domain($request->url) || 'www.tiktok.com'==get_domain($request->url)){
				$aladinurlredirectembed.='<blockquote class="tiktok-embed" cite="'.$request->url.'" data-unique-id="melonnt" data-embed-type="creator" style="max-width: 780px; min-width: 288px;" > <section> <a target="_blank" href="'.$request->url.'?refer=creator_embed">'.$search.'</a> </section> </blockquote> <script async src="https://www.tiktok.com/embed.js"></script>';
				$done='done';
					
				}elseif('reddit.com'==get_domain($request->url) || 'www.reddit.com'==get_domain($request->url)){	
							$aladinurlredirectembed.='<blockquote class="reddit-embed-bq" style="height:500px" data-embed-height="740"><a href="'.$request->url.'"></a></blockquote><script async="" src="https://embed.reddit.com/widgets.js" charset="UTF-8"></script>';
							$done='done';
							}
			elseif($linkdomain=='https://kick.com/'){
				$aladinurlredirectembed.='<iframe src="https://player.kick.com/'.$search.'" height="888" width="100%" frameborder="0" scrolling="yes" allowfullscreen="true"></iframe>';
				$done='done';
					
				}elseif($linkdomain=='https://live.arrival.space/'){
				$aladinurlredirectembed.='<iframe src="https://live.arrival.space/'.$search.'" height="888" width="100%" frameborder="0" scrolling="yes" allowfullscreen="true"></iframe>';
				$done='done';
					
				}elseif($linkdomain=='https://beacons.ai/'){
				$aladinurlredirectembed.='<iframe src="https://beacons.ai/'.$search.'" height="888" width="100%" frameborder="0" scrolling="yes" allowfullscreen="true"></iframe>';
				$done='done';
					
				}elseif($linkdomain=='https://twitter.com/'){
					$aladinurlredirectembed.='<a class="twitter-timeline" href="https://twitter.com/'.$search.'?ref_src=twsrc%5Etfw">Tweets by JaredFPS</a><script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>';
						$done='done';	
					}elseif($linkdomain=='https://pinterest.com/'){
					$aladinurlredirectembed.='<a data-pin-do="embedUser" data-pin-board-width="1024" data-pin-scale-height="888" data-pin-scale-width="80" href="https://www.pinterest.com/'.$search.'/">Follow '.$search.' on Pinterest</a><script async defer src="//assets.pinterest.com/js/pinit.js"></script>';
					$done='done';		
					}else
					{
		$checkurl=substr_count($urlnew, '/');
		if($checkurl<=3){
		$curl = curl_init($urlnew);
		curl_setopt($curl, CURLOPT_RETURNTRANSFER, TRUE);
		curl_setopt($curl,CURLOPT_USERAGENT,'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.13) Gecko/20080311 Firefox/2.0.0.13');
		curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
		curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);
		$html = curl_exec($curl);
		$crawler = new Crawler($html);
		$img = $crawler->filter('img')->each(function($node) {
			$src  = $node->attr('src');
			return compact('src');
		});
		$texth1 = $crawler->filter('h1')->each(function($node) {
			$text  = $node->text();
			return compact('text');
		});
		$textp = $crawler->filter('p')->each(function($node) {
			$text  = $node->text();
			return compact('text');
		});
		$textspan = $crawler->filter('span')->each(function($node) {
			$text  = $node->text();
			return compact('text');
		});
		$texth5 = $crawler->filter('h5')->each(function($node) {
			$text  = $node->text();
			return compact('text');
		});
		$links = $crawler->filter('a')->each(function($node) {
			$href  = $node->attr('href');
			$title = $node->attr('title');
			$text  = $node->text();
		
			return compact('href', 'title', 'text');
		});
		
		if($linkdomain=='https://lnk.bio/'){
			
			if(!empty($links))
			{
			$aladinurlredirectembed.='<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Profile Page</title><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"><style>.bodycontaner{font-family:Arial,sans-serif;background:linear-gradient(90deg,rgba(255,223,0,1) 0%,rgba(255,176,0,1) 100%);display:flex;justify-content:center;align-items:center;padding:10px;}.profile-container{background-color:#1a1a1a;border-radius:20px;text-align:center;width:400px;padding:20px;position:relative;box-shadow:0 6px 12px rgba(0,0,0,0.3);transition:all .3s ease}.profile-container:hover{transform:scale(1.02);box-shadow:0 8px 16px rgba(0,0,0,0.4)}.header-bg{width:100%;border-radius:20px 20px 0 0;height:150px;object-fit:cover}.profile-pic{position:absolute;top:80px;left:50%;transform:translateX(-50%);border-radius:50%;overflow:hidden;width:130px;height:130px;border:4px solid #fff;background-color:#000}.profile-pic img{width:100%;height:100%;object-fit:cover}.username{color:#fff;margin-top:50px;font-size:24px;font-weight:700}.real-name{color:#ddd;font-size:16px}.tagline,.description{color:#bbb;margin:5px 0}.social-icons{margin-top:15px}.social-icon{display:inline-block;margin:0 10px;padding:5px;transition:transform .3s ease;font-size:24px;color:#fff}.social-icon:hover{transform:scale(1.2);color:orange}.links{margin-top:20px;display:flex;flex-direction:column;align-items:center}.link-button{display:flex;align-items:center;justify-content:center;background-color:#444;color:#fff;width:90%;padding:12px 0;margin:10px 0;text-decoration:none;border-radius:30px;border:1px solid #555;font-size:16px;font-weight:700;transition:all .3s ease;position:relative}.link-button:hover{background-color:#555;box-shadow:0 4px 8px rgba(0,0,0,0.2)}.link-button::before{content:"";position:absolute;left:15px;width:24px;height:24px;background-image:url(link-icon.png);background-size:cover;background-repeat:no-repeat}@media (max-width: 600px){.profile-container{width:90%}.username{font-size:20px}.real-name{font-size:14px}.link-button{font-size:14px}} </style></head><body><div class="bodycontaner" ><div class="profile-container"> <div class="header"> <img src="'.url('/').'/yellow.webp" alt="Background" class="header-bg"> </div>';
			if(!empty($img)){ 
				$aladinurlredirectembed.='<div class="profile-pic"> <img src="'.$img[0]['src'].'" alt="Profile Picture"></div>';
				} 
			 
				$aladinurlredirectembed.='<h1 class="username">'.$links[10]['text'].'</h1><div class="social-icons"> <a href="#" class="social-icon"><i class="fas fa-envelope"></i></a> <a href="#" class="social-icon"><i class="fab fa-twitter"></i></a> <a href="#" class="social-icon"><i class="fab fa-youtube"></i></a> <a href="#" class="social-icon"><i class="fab fa-facebook"></i></a> </div><div class="links">';
				$done='';
			foreach ($links as $link) {
				if($link['title']=='Get Lnk.Bio')
				{
				 $done='done';
				}
			if($link['title']!='' && $done=='' && $link['text']!='Lnk.Bio'){ 
					$aladinurlredirectembed.='<a href="'.$link['href'].'" class="link-button" target="_blank" >'.$link['text'].'</a>';		
				 }
			} 
			$aladinurlredirectembed.='</div></div></div></body></html>';
			$done='done';
			}
			
		}elseif($linkdomain=='https://campsite.bio/')
		{
			if(!empty($links))
		{
			$aladinurlredirectembed.='<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Profile Page</title><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"><style>.bodycontaner{font-family:Arial,sans-serif;background:linear-gradient(90deg,rgba(255,223,0,1) 0%,rgba(255,176,0,1) 100%);display:flex;justify-content:center;align-items:center;padding:10px;}.profile-container{background-color:#1a1a1a;border-radius:20px;text-align:center;width:400px;padding:20px;position:relative;box-shadow:0 6px 12px rgba(0,0,0,0.3);transition:all .3s ease}.profile-container:hover{transform:scale(1.02);box-shadow:0 8px 16px rgba(0,0,0,0.4)}.header-bg{width:100%;border-radius:20px 20px 0 0;height:150px;object-fit:cover}.profile-pic{position:absolute;top:80px;left:50%;transform:translateX(-50%);border-radius:50%;overflow:hidden;width:130px;height:130px;border:4px solid #fff;background-color:#000}.profile-pic img{width:100%;height:100%;object-fit:cover}.username{color:#fff;margin-top:50px;font-size:24px;font-weight:700}.real-name{color:#ddd;font-size:16px}.tagline,.description{color:#bbb;margin:5px 0}.social-icons{margin-top:15px}.social-icon{display:inline-block;margin:0 10px;padding:5px;transition:transform .3s ease;font-size:24px;color:#fff}.social-icon:hover{transform:scale(1.2);color:orange}.links{margin-top:20px;display:flex;flex-direction:column;align-items:center}.link-button{display:flex;align-items:center;justify-content:center;background-color:#444;color:#fff;width:90%;padding:12px 0;margin:10px 0;text-decoration:none;border-radius:30px;border:1px solid #555;font-size:16px;font-weight:700;transition:all .3s ease;position:relative}.link-button:hover{background-color:#555;box-shadow:0 4px 8px rgba(0,0,0,0.2)}.link-button::before{content:"";position:absolute;left:15px;width:24px;height:24px;background-image:url(link-icon.png);background-size:cover;background-repeat:no-repeat}@media (max-width: 600px){.profile-container{width:90%}.username{font-size:20px}.real-name{font-size:14px}.link-button{font-size:14px}} </style></head><body><div class="bodycontaner" ><div class="profile-container"> <div class="header"> <img src="'.url('/').'/yellow.webp" alt="Background" class="header-bg"> </div>';
			if(!empty($img)){$aladinurlredirectembed.='<div class="profile-pic"><img src="'.$img[0]['src'].'" alt="Profile Picture"></div>';} 
				$aladinurlredirectembed.='<h1 class="username">';
				if(!empty($texth1)){ $aladinurlredirectembed.=$texth1[0]['text']; } 
				$aladinurlredirectembed.='</h1>';
				$aladinurlredirectembed.='<p class="real-name">';
				if(!empty($textp)){ $aladinurlredirectembed.=$textp[0]['text']; } 
				$aladinurlredirectembed.='</p><div class="social-icons"> <a href="#" class="social-icon"><i class="fas fa-envelope"></i></a> <a href="#" class="social-icon"><i class="fab fa-twitter"></i></a> <a href="#" class="social-icon"><i class="fab fa-youtube"></i></a> <a href="#" class="social-icon"><i class="fab fa-facebook"></i></a> </div><div class="links">';
		foreach ($links as $link) {
		if($link['text']!=''){ 
		if(preg_match( '/^(http|https):\\/\\/[a-z0-9]+([\\-\\.]{1}[a-z0-9]+)*\\.[a-z]{2,5}'.'((:[0-9]{1,5})?\\/.*)?$/i' ,$link['href'] . PHP_EOL)){
		$aladinurlredirectembed.='<a href="'.$link['href'].'" class="link-button" target="_blank" >'.$link['text'].'</a>';		
		} }}
		$aladinurlredirectembed.='</div></div></div></body></html>';
		$done='done';
			}
		}elseif($linkdomain=='https://bio.site/')
		{
			if(!empty($links))
		{
			$aladinurlredirectembed.='<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Profile Page</title><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"><style>.bodycontaner{font-family:Arial,sans-serif;background:linear-gradient(90deg,rgba(255,223,0,1) 0%,rgba(255,176,0,1) 100%);display:flex;justify-content:center;align-items:center;padding:10px;}.profile-container{background-color:#1a1a1a;border-radius:20px;text-align:center;width:400px;padding:20px;position:relative;box-shadow:0 6px 12px rgba(0,0,0,0.3);transition:all .3s ease}.profile-container:hover{transform:scale(1.02);box-shadow:0 8px 16px rgba(0,0,0,0.4)}.header-bg{width:100%;border-radius:20px 20px 0 0;height:150px;object-fit:cover}.profile-pic{position:absolute;top:80px;left:50%;transform:translateX(-50%);border-radius:50%;overflow:hidden;width:130px;height:130px;border:4px solid #fff;background-color:#000}.profile-pic img{width:100%;height:100%;object-fit:cover}.username{color:#fff;margin-top:50px;font-size:24px;font-weight:700}.real-name{color:#ddd;font-size:16px}.tagline,.description{color:#bbb;margin:5px 0}.social-icons{margin-top:15px}.social-icon{display:inline-block;margin:0 10px;padding:5px;transition:transform .3s ease;font-size:24px;color:#fff}.social-icon:hover{transform:scale(1.2);color:orange}.links{margin-top:20px;display:flex;flex-direction:column;align-items:center}.link-button{display:flex;align-items:center;justify-content:center;background-color:#444;color:#fff;width:90%;padding:12px 0;margin:10px 0;text-decoration:none;border-radius:30px;border:1px solid #555;font-size:16px;font-weight:700;transition:all .3s ease;position:relative}.link-button:hover{background-color:#555;box-shadow:0 4px 8px rgba(0,0,0,0.2)}.link-button::before{content:"";position:absolute;left:15px;width:24px;height:24px;background-image:url(link-icon.png);background-size:cover;background-repeat:no-repeat}@media (max-width: 600px){.profile-container{width:90%}.username{font-size:20px}.real-name{font-size:14px}.link-button{font-size:14px}} </style></head><body><div class="bodycontaner" ><div class="profile-container"> <div class="header"> <img src="'.url('/').'/yellow.webp" alt="Background" class="header-bg"> </div>';
			if(!empty($img)){ $image=''; foreach ($img as $imgs) { if(@getimagesize($imgs['src']) && $image!='done'){ $image='done';
				$aladinurlredirectembed.='<div class="profile-pic"><img src="'.$imgs['src'].'" alt="Profile Picture"></div>';
				}}} 
				$aladinurlredirectembed.='<h1 class="username">';
				if(!empty($texth1)){ $aladinurlredirectembed.=$texth1[0]['text']; } 
				$aladinurlredirectembed.='</h1>';
				$aladinurlredirectembed.='<p class="real-name">';
				if(!empty($textp)){ $aladinurlredirectembed.=$textp[0]['text']; } 
				$aladinurlredirectembed.='</p><div class="social-icons"> <a href="#" class="social-icon"><i class="fas fa-envelope"></i></a> <a href="#" class="social-icon"><i class="fab fa-twitter"></i></a> <a href="#" class="social-icon"><i class="fab fa-youtube"></i></a> <a href="#" class="social-icon"><i class="fab fa-facebook"></i></a> </div><div class="links">';
		foreach ($links as $link) {
		
		if($link['text']!='' && $link['text']!='Create a free Bio Site'){ 
		if(preg_match( '/^(http|https):\\/\\/[a-z0-9]+([\\-\\.]{1}[a-z0-9]+)*\\.[a-z]{2,5}'.'((:[0-9]{1,5})?\\/.*)?$/i' ,$link['href'] . PHP_EOL)){
		$aladinurlredirectembed.='<a href="'.$link['href'].'" class="link-button" target="_blank" >'.$link['text'].'</a>';		
		} }
		}
		$aladinurlredirectembed.='</div></div></div></body></html>';
		$done='done';
			}
		}elseif($linkdomain=='https://hoo.be/')
		{
			if(!empty($links))
		{
			$aladinurlredirectembed.='<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Profile Page</title><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"><style>.bodycontaner{font-family:Arial,sans-serif;background:linear-gradient(90deg,rgba(255,223,0,1) 0%,rgba(255,176,0,1) 100%);display:flex;justify-content:center;align-items:center;padding:10px;}.profile-container{background-color:#1a1a1a;border-radius:20px;text-align:center;width:400px;padding:20px;position:relative;box-shadow:0 6px 12px rgba(0,0,0,0.3);transition:all .3s ease}.profile-container:hover{transform:scale(1.02);box-shadow:0 8px 16px rgba(0,0,0,0.4)}.header-bg{width:100%;border-radius:20px 20px 0 0;height:150px;object-fit:cover}.profile-pic{position:absolute;top:80px;left:50%;transform:translateX(-50%);border-radius:50%;overflow:hidden;width:130px;height:130px;border:4px solid #fff;background-color:#000}.profile-pic img{width:100%;height:100%;object-fit:cover}.username{color:#fff;margin-top:50px;font-size:24px;font-weight:700}.real-name{color:#ddd;font-size:16px}.tagline,.description{color:#bbb;margin:5px 0}.social-icons{margin-top:15px}.social-icon{display:inline-block;margin:0 10px;padding:5px;transition:transform .3s ease;font-size:24px;color:#fff}.social-icon:hover{transform:scale(1.2);color:orange}.links{margin-top:20px;display:flex;flex-direction:column;align-items:center}.link-button{display:flex;align-items:center;justify-content:center;background-color:#444;color:#fff;width:90%;padding:12px 0;margin:10px 0;text-decoration:none;border-radius:30px;border:1px solid #555;font-size:16px;font-weight:700;transition:all .3s ease;position:relative}.link-button:hover{background-color:#555;box-shadow:0 4px 8px rgba(0,0,0,0.2)}.link-button::before{content:"";position:absolute;left:15px;width:24px;height:24px;background-image:url(link-icon.png);background-size:cover;background-repeat:no-repeat}@media (max-width: 600px){.profile-container{width:90%}.username{font-size:20px}.real-name{font-size:14px}.link-button{font-size:14px}} </style></head><body><div class="bodycontaner" ><div class="profile-container"> <div class="header"> <img src="'.url('/').'/yellow.webp" alt="Background" class="header-bg"> </div>';
			if(!empty($img)){
							$aladinurlredirectembed.='<div class="profile-pic"><img src="https://hoo.be/'.$img[1]['src'].'" alt="Profile Picture"></div>';
			} 
				$aladinurlredirectembed.='<h1 class="username">';
				if(!empty($textspan)){ $aladinurlredirectembed.=$textspan[0]['text']; } 
				$aladinurlredirectembed.='</h1>';
				$aladinurlredirectembed.='<p class="real-name">';
				if(!empty($texth5)){ $aladinurlredirectembed.=$texth5[0]['text']; } 
				$aladinurlredirectembed.='</p><div class="social-icons"> <a href="#" class="social-icon"><i class="fas fa-envelope"></i></a> <a href="#" class="social-icon"><i class="fab fa-twitter"></i></a> <a href="#" class="social-icon"><i class="fab fa-youtube"></i></a> <a href="#" class="social-icon"><i class="fab fa-facebook"></i></a> </div><div class="links">';
		foreach ($links as $link) {
		if($link['text']!='' && strtolower($link['text'])!=strtolower('FacebookFacebook') && strtolower($link['text'])!=strtolower('InstagramInstagram') && strtolower($link['text'])!=strtolower('YouTubeYouTube') && strtolower($link['text'])!=strtolower('EmailEmail') && strtolower($link['text'])!=strtolower('XX') && strtolower($link['text'])!=strtolower('Share on Twitter') && strtolower($link['text'])!=strtolower('Share on Facebook') && isCSS($link['text'])){ 
		if(preg_match( '/^(http|https):\\/\\/[a-z0-9]+([\\-\\.]{1}[a-z0-9]+)*\\.[a-z]{2,5}'.'((:[0-9]{1,5})?\\/.*)?$/i' ,$link['href'] . PHP_EOL)){
		$aladinurlredirectembed.='<a href="'.$link['href'].'" class="link-button" target="_blank" >'.$link['text'].'</a>';		
		} }}
		$aladinurlredirectembed.='</div></div></div></body></html>';
		$done='done';
		}	
		}elseif($linkdomain=='https://linktr.ee/')
		{
		if(!empty($links))
		{
			$aladinurlredirectembed.='<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Profile Page</title><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"><style>.bodycontaner{font-family:Arial,sans-serif;background:linear-gradient(90deg,rgba(255,223,0,1) 0%,rgba(255,176,0,1) 100%);display:flex;justify-content:center;align-items:center;padding:10px;}.profile-container{background-color:#1a1a1a;border-radius:20px;text-align:center;width:400px;padding:20px;position:relative;box-shadow:0 6px 12px rgba(0,0,0,0.3);transition:all .3s ease}.profile-container:hover{transform:scale(1.02);box-shadow:0 8px 16px rgba(0,0,0,0.4)}.header-bg{width:100%;border-radius:20px 20px 0 0;height:150px;object-fit:cover}.profile-pic{position:absolute;top:80px;left:50%;transform:translateX(-50%);border-radius:50%;overflow:hidden;width:130px;height:130px;border:4px solid #fff;background-color:#000}.profile-pic img{width:100%;height:100%;object-fit:cover}.username{color:#fff;margin-top:50px;font-size:24px;font-weight:700}.real-name{color:#ddd;font-size:16px}.tagline,.description{color:#bbb;margin:5px 0}.social-icons{margin-top:15px}.social-icon{display:inline-block;margin:0 10px;padding:5px;transition:transform .3s ease;font-size:24px;color:#fff}.social-icon:hover{transform:scale(1.2);color:orange}.links{margin-top:20px;display:flex;flex-direction:column;align-items:center}.link-button{display:flex;align-items:center;justify-content:center;background-color:#444;color:#fff;width:90%;padding:12px 0;margin:10px 0;text-decoration:none;border-radius:30px;border:1px solid #555;font-size:16px;font-weight:700;transition:all .3s ease;position:relative}.link-button:hover{background-color:#555;box-shadow:0 4px 8px rgba(0,0,0,0.2)}.link-button::before{content:"";position:absolute;left:15px;width:24px;height:24px;background-image:url(link-icon.png);background-size:cover;background-repeat:no-repeat}@media (max-width: 600px){.profile-container{width:90%}.username{font-size:20px}.real-name{font-size:14px}.link-button{font-size:14px}} </style></head><body><div class="bodycontaner" ><div class="profile-container"> <div class="header"> <img src="'.url('/').'/yellow.webp" alt="Background" class="header-bg"> </div>';
			if(!empty($img)){ $image=''; foreach ($img as $imgs) { if(@getimagesize($imgs['src']) && $image!='done'){ $image='done';
				$aladinurlredirectembed.='<div class="profile-pic"> <img src="'.$imgs['src'].'" alt="Profile Picture"> </div>';
				}}} 
				$aladinurlredirectembed.='<h1 class="username">';
				if(!empty($texth1)){ $texth1done=''; foreach ($texth1 as $texth1s) { if(isCSS($texth1s['text']) && $texth1done!='done'){ $texth1done='done'; $aladinurlredirectembed.=$texth1s['text']; session()->put('linkname', trim($texth1s['text'])); }}} 
				$aladinurlredirectembed.='</h1><div class="social-icons"> <a href="#" class="social-icon"><i class="fas fa-envelope"></i></a> <a href="#" class="social-icon"><i class="fab fa-twitter"></i></a> <a href="#" class="social-icon"><i class="fab fa-youtube"></i></a> <a href="#" class="social-icon"><i class="fab fa-facebook"></i></a> </div><div class="links">';
		foreach ($links as $link) {
		if($link['text']!='' && strtolower($link['text'])!=strtolower('FacebookFacebook') && strtolower($link['text'])!=strtolower('InstagramInstagram') && strtolower($link['text'])!=strtolower('YouTubeYouTube') && strtolower($link['text'])!=strtolower('EmailEmail') && strtolower($link['text'])!=strtolower('XX') && strtolower($link['text'])!=strtolower('Share on Twitter') && strtolower($link['text'])!=strtolower('Share on Facebook') && isCSS($link['text'])){ 
		if(preg_match( '/^(http|https):\\/\\/[a-z0-9]+([\\-\\.]{1}[a-z0-9]+)*\\.[a-z]{2,5}'.'((:[0-9]{1,5})?\\/.*)?$/i' ,$link['href'] . PHP_EOL)){
		$aladinurlredirectembed.='<a href="'.$link['href'].'" class="link-button" target="_blank" >'.$link['text'].'</a>';		
		} }}
		$aladinurlredirectembed.='</div></div></div></body></html>';
		$done='done';
		}
		}elseif($linkdomain=='https://portaly.cc/')
		{
		if(!empty($links))
		{
			$aladinurlredirectembed.='<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Profile Page</title><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"><style>.bodycontaner{font-family:Arial,sans-serif;background:linear-gradient(90deg,rgba(255,223,0,1) 0%,rgba(255,176,0,1) 100%);display:flex;justify-content:center;align-items:center;padding:10px;}.profile-container{background-color:#1a1a1a;border-radius:20px;text-align:center;width:400px;padding:20px;position:relative;box-shadow:0 6px 12px rgba(0,0,0,0.3);transition:all .3s ease}.profile-container:hover{transform:scale(1.02);box-shadow:0 8px 16px rgba(0,0,0,0.4)}.header-bg{width:100%;border-radius:20px 20px 0 0;height:150px;object-fit:cover}.profile-pic{position:absolute;top:80px;left:50%;transform:translateX(-50%);border-radius:50%;overflow:hidden;width:130px;height:130px;border:4px solid #fff;background-color:#000}.profile-pic img{width:100%;height:100%;object-fit:cover}.username{color:#fff;margin-top:50px;font-size:24px;font-weight:700}.real-name{color:#ddd;font-size:16px}.tagline,.description{color:#bbb;margin:5px 0}.social-icons{margin-top:15px}.social-icon{display:inline-block;margin:0 10px;padding:5px;transition:transform .3s ease;font-size:24px;color:#fff}.social-icon:hover{transform:scale(1.2);color:orange}.links{margin-top:20px;display:flex;flex-direction:column;align-items:center}.link-button{display:flex;align-items:center;justify-content:center;background-color:#444;color:#fff;width:90%;padding:12px 0;margin:10px 0;text-decoration:none;border-radius:30px;border:1px solid #555;font-size:16px;font-weight:700;transition:all .3s ease;position:relative}.link-button:hover{background-color:#555;box-shadow:0 4px 8px rgba(0,0,0,0.2)}.link-button::before{content:"";position:absolute;left:15px;width:24px;height:24px;background-image:url(link-icon.png);background-size:cover;background-repeat:no-repeat}@media (max-width: 600px){.profile-container{width:90%}.username{font-size:20px}.real-name{font-size:14px}.link-button{font-size:14px}} </style></head><body><div class="bodycontaner" ><div class="profile-container"> <div class="header"> <img src="'.url('/').'/yellow.webp" alt="Background" class="header-bg"> </div>';
			if(!empty($img)){ $image=''; foreach ($img as $imgs) { if(@getimagesize($imgs['src']) && $image!='done'){ $image='done';
				$aladinurlredirectembed.='<div class="profile-pic"><img src="'.$imgs['src'].'" alt="Profile Picture"></div>';
				}}} 
				$aladinurlredirectembed.='<h1 class="username">';
				if(!empty($texth1)){ $texth1done=''; foreach ($texth1 as $texth1s) { if(isCSS($texth1s['text']) && $texth1done!='done'){ $texth1done='done'; $aladinurlredirectembed.=$texth1s['text']; session()->put('linkname', trim($texth1s['text'])); }}} 
				$aladinurlredirectembed.='</h1>';
				$aladinurlredirectembed.='<p class="real-name">';
				if(!empty($textp)){ $aladinurlredirectembed.=$textp[0]['text']; }
				$aladinurlredirectembed.='</p><div class="social-icons"> <a href="#" class="social-icon"><i class="fas fa-envelope"></i></a> <a href="#" class="social-icon"><i class="fab fa-twitter"></i></a> <a href="#" class="social-icon"><i class="fab fa-youtube"></i></a> <a href="#" class="social-icon"><i class="fab fa-facebook"></i></a> </div><div class="links">';
		foreach ($links as $link) {
		if($link['text']!='' && strtolower($link['text'])!=strtolower('FacebookFacebook') && strtolower($link['text'])!=strtolower('InstagramInstagram') && strtolower($link['text'])!=strtolower('YouTubeYouTube') && strtolower($link['text'])!=strtolower('EmailEmail') && strtolower($link['text'])!=strtolower('XX') && strtolower($link['text'])!=strtolower('Share on Twitter') && strtolower($link['text'])!=strtolower('Share on Facebook') && isCSS($link['text'])){ 
		if(preg_match( '/^(http|https):\\/\\/[a-z0-9]+([\\-\\.]{1}[a-z0-9]+)*\\.[a-z]{2,5}'.'((:[0-9]{1,5})?\\/.*)?$/i' ,$link['href'] . PHP_EOL)){
		$aladinurlredirectembed.='<a href="'.$link['href'].'" class="link-button" target="_blank" >'.$link['text'].'</a>';		
		} }}
		$aladinurlredirectembed.='</div></div></div></body></html>';
		$done='done';
		}
		}elseif($linkdomain=='https://link3.cc/')
		{
		$aladinurlredirectembed.='<iframe loading="lazy" allow="camera; microphone; fullscreen; display-capture; autoplay" style="border: 0;" src="'.$linkdomain.$search.'" width="100%" height="888px" allowfullscreen="allowfullscreen" ></iframe>';	
		$done='done';
		}
		
					}
				}	
			}
		}
			if($done!='done')
			{
			if (filter_var($request->url, FILTER_VALIDATE_URL)) {
				$isFriendly = IframeHelper::isIframeable($request->url);
			if ($isFriendly) {
				$themeData['image'] = $request->url;	
			} else {
				$fullImageUrl = $request->url;
				$validImageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'tif', 'webp', 'apng', 'svg', 'ico'];
				$validDocumentExtensions = ['ppt', 'pptx', 'pdf', 'xls', 'xlsx', 'doc', 'docx', 'pages', 'ai', 'psd', 'eps', 'ttf', 'dxf', 'xps', 'rar', 'zip', 'ods', 'odt', 'odp'];

				// Check file extension first
				$urlPath = parse_url($fullImageUrl, PHP_URL_PATH);
				$extension = pathinfo($urlPath, PATHINFO_EXTENSION);

				if (in_array(strtolower($extension), array_merge($validImageExtensions, $validDocumentExtensions))) {
					$themeData['image'] = $request->url;
				}else{
				$patterns = [
								'/(?:youtube(?:-nocookie)?\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/i',
								'/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|posts|company|feed|showcase|embed\/feed\/update\/urn:li:[^\/]+:[^"&?\/ ]+)/i',
								'/^https?:\/\/(?:www\.|player\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)(?:[?]?.*)$/im',
								'/^(https?:\/\/)?(www\.)?fb\.watch\/[a-zA-Z0-9(\.\?)?]/',
								'/^(https?:\/\/)?(www\.)?facebook\.com\/[a-zA-Z0-9(\.\?)?]/',
								'/<iframe.*?src=["\'](.*?)["\'].*?>.*?<\/iframe>/is',
								'/<blockquote/',
								'/reddit\.com\/r\/\w+\/comments\/\w+\/\w+\//',
								'/reddit-embed-bq/'
							];

							// Check if any pattern matches
							$isValid = false;
							foreach ($patterns as $pattern) {
								if (preg_match($pattern, $request->url)) {
									$isValid = true;
									break;
								}
							}

							if (!$isValid) {
								$str = ['{backimage}','{backcolor}','{favicon}','{providerName}','{loadingurl}','{image}','{title}','{description}'];
								$curl = curl_init('https://api.microlink.io/?url='.$request->url);
								curl_setopt($curl, CURLOPT_RETURNTRANSFER, TRUE);
								curl_setopt($curl,CURLOPT_USERAGENT,'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.13) Gecko/20080311 Firefox/2.0.0.13');
								$page = curl_exec($curl);
								$arraypage=array_values(json_decode($page, true));
								$publisher='';
								$logo='';
								$urlpage='';
								$image='';
								$title='';
								$description='';
								if($arraypage[1]['publisher']!=null)
								{
								$publisher=$arraypage[1]['publisher'];	
								}
								if($arraypage[1]['logo']!=null)
								{
								$logo=$arraypage[1]['logo']['url'];
								}
								if($arraypage[1]['url']!=null)
								{
								$urlpage=$arraypage[1]['url'];
								}
								if($arraypage[1]['image']!=null)
								{
								$image=$arraypage[1]['image']['url'];
								}
								if($arraypage[1]['title']!=null)
								{
								$title=$arraypage[1]['title'];
								}
								if($arraypage[1]['description']!=null)
								{
								$description=$arraypage[1]['description'];
								}
								$fav='<img src="'.$logo.'" width="20px;" >';
								$rplc =['','',$fav,$publisher,$urlpage,printImage($image),printText($title),printText($description)];
								$code = Page::where('id',1)->value('code');
								$divstr=str_replace($str,$rplc,$code);
								$themeData['image'] = $divstr;
							}else
							{
							$themeData['image'] = $request->url;	
							}
				}
			}
			} else {
				$themeData['image'] = $request->url;
			}
			}else
			{
				$themeData['image'] = $aladinurlredirectembed;
			}
    }
    
    $theme = Template::create($themeData);
    $theme = Template::where('id', $theme->id)->first();
	if($request->linkedinpost==1)
	{
		if (!Auth::check() || !Auth::user()->linkedin_access_token) {
            return back()->with('error', 'You must be logged in via LinkedIn to share.');
        }

        $user = Auth::user();
        $accessToken = $user->linkedin_access_token;
		$commentary = $request->title.' '.$request->description;
		// 1. Get the Author URN from the OPENID userinfo endpoint
            $responseMe = Http::withToken($accessToken)
                ->get('https://api.linkedin.com/v2/userinfo'); 

            if ($responseMe->failed()) {
                throw new \Exception('Failed to retrieve LinkedIn URN from userinfo: ' . ($responseMe->json()['message'] ?? 'Unknown error.'));
            }

            $linkedinMe = $responseMe->json();
            $subId = $linkedinMe['sub'];
            
            $authorUrn = 'urn:li:person:' . $linkedinMe['sub'];

		$payload = [
			'author' => $authorUrn,
			'lifecycleState' => 'PUBLISHED',
			'specificContent' => [
				'com.linkedin.ugc.ShareContent' => [
					'shareCommentary' => [
						'text' => $commentary,
					],
					'shareMediaCategory' => 'ARTICLE',
					'media' => [
						[
							'status' => 'READY',
							'originalUrl' => 'https://ez.wiki/'.$theme->unique_id,
							'title' => ['text' => 'Ez.wiki Theme url'], // Optional
						]
					]
				],
			],
			'visibility' => [
				'com.linkedin.ugc.MemberNetworkVisibility' => 'PUBLIC',
			],
		];
        // 3. Send the post request
        $response = Http::withToken($accessToken)
            ->withHeaders([
                'X-Restli-Protocol-Version' => '2.0.0',
                'Content-Type' => 'application/json',
                'Content-Language' => 'en-US',
            ])
            ->post('https://api.linkedin.com/v2/ugcPosts', $payload);
	}
	if($request->redditpost==1)
	{
		$user = Auth::user();

        if (!$user->reddit_token) {
            return back()->with('error', 'Please login with Reddit first.');
        }
		$userAgent = 'LaravelApp:v1.0 (by /u/' . $user->name . ')';

        $response = Http::withToken($user->reddit_token)
            ->withHeaders(['User-Agent' => $userAgent])
            ->asForm() // IMPORTANT: Reddit API expects Form Data, not JSON
            ->post('https://oauth.reddit.com/api/submit', [
                'sr'       => 'test',             // The Subreddit (e.g., 'test', 'laravel')
                'kind'     => 'self',             // 'self' for text, 'link' for URLs
                'title'    => $request->title,
                'text'     => $request->description.' https://ez.wiki/'.$theme->unique_id,
                'api_type' => 'json',
            ]);

	}
    return response()->json([
        'message' => 'Theme created successfully',
        'theme' => $theme
    ]);
}

public function update(Request $request, $id)
{
    $request->validate([
        'title' => 'required|string|max:255',
        'id' => 'required|exists:templates,id'
    ]);
	function get_domain($url)
		{
			if (empty($url)) {
				return false;
			}
			
			$host = parse_url($url, PHP_URL_HOST);
			if (!$host) {
				return false;
			}
			
			// Remove www. prefix
			$domain = preg_replace('/^www\./', '', $host);
			
			// Basic domain validation
			if (filter_var($domain, FILTER_VALIDATE_DOMAIN, FILTER_FLAG_HOSTNAME)) {
				return $domain;
			}
			
			return false;
		}
		function printText(?string $text)
		{
			if ($text) {
			return htmlspecialchars($text, ENT_IGNORE);
			}
		}
		function isCSS($text) {
		$pattern = '/\.[a-zA-Z0-9_-]+{[^}]*}/';
		if (preg_match($pattern, $text)) {
			return false;
		}
		return true;
		}
		function printImage(?string $image)
		{
			if ($image) {
			return '<img src="'.$image.'" width="100%" >';
			}else
			{
				return '<img src="/bee.webp" width="100%" >';
			}
		}
		function printfav(?string $image)
		{
			if ($image) {
			   return '<img src="'.$image.'" width="36px" >';
			}
			return null;
		}
		
		function random_color_part() {
		 return str_pad( dechex( mt_rand( 0, 255 ) ), 2, '0', STR_PAD_LEFT);
		}

		function random_color() {
		 return random_color_part() . random_color_part() . random_color_part();
		}
    $theme = Template::where('unique_id', $id)->firstOrFail();
    // Verify the user owns this theme (or is admin)
    if ($theme->user_id !== auth()->id() && !auth()->user()->isAdmin()) {
        return response()->json([
            'message' => 'Unauthorized to update this theme'
        ], 403);
    }

    $themeData = [
        'title' => $request->title,
        'description' => $request->description,
        'price' => $request->price ?? $theme->price,
		'leftwidth' => $request->leftwidth ?? $theme->leftwidth,
		'rightwidth' => $request->rightwidth ?? $theme->rightwidth,
		'bgcolour' => $request->bgcolour ?? $theme->bgcolour,
        'option' => $request->option ?? $theme->option,
    ];

    // Handle file upload if present
    if ($request->hasFile('file')) {
        // Delete old image if it exists
        if ($theme->image && file_exists(public_path($theme->image))) {
            unlink(public_path($theme->image));
        }

        $image = $request->file('file');
        $imageName = time() . '_.' . $image->getClientOriginalExtension();
        $destinationPath = public_path('template_pic');
        
        if (!file_exists($destinationPath)) {
            mkdir($destinationPath, 0755, true);
        }
        
        $image->move($destinationPath, $imageName);
        $themeData['image'] = 'template_pic/' . $imageName;
    } 
    // Only update URL if no file was uploaded and URL was provided
    elseif ($request->filled('url') && !$request->hasFile('file')) {
		$done='';
			$aladinurlredirectembed='';
			if(isset($request->url)){
		$parse = explode('/',$request->url);
		if(isset($parse[3])){
			$linkdomain=$parse[0].'//'.$parse[2].'/';
			$search=$parse[3];
			$urlnew=$request->url;
			if('tiktok.com'==get_domain($request->url) || 'www.tiktok.com'==get_domain($request->url)){
				$aladinurlredirectembed.='<blockquote class="tiktok-embed" cite="'.$request->url.'" data-unique-id="melonnt" data-embed-type="creator" style="max-width: 780px; min-width: 288px;" > <section> <a target="_blank" href="'.$request->url.'?refer=creator_embed">'.$search.'</a> </section> </blockquote> <script async src="https://www.tiktok.com/embed.js"></script>';
				$done='done';
					
				}elseif('reddit.com'==get_domain($request->url) || 'www.reddit.com'==get_domain($request->url)){	
							$aladinurlredirectembed.='<blockquote class="reddit-embed-bq" style="height:500px" data-embed-height="740"><a href="'.$request->url.'"></a></blockquote><script async="" src="https://embed.reddit.com/widgets.js" charset="UTF-8"></script>';
							$done='done';
							}
			elseif($linkdomain=='https://kick.com/'){
				$aladinurlredirectembed.='<iframe src="https://player.kick.com/'.$search.'" height="888" width="100%" frameborder="0" scrolling="yes" allowfullscreen="true"></iframe>';
				$done='done';
					
				}elseif($linkdomain=='https://live.arrival.space/'){
				$aladinurlredirectembed.='<iframe src="https://live.arrival.space/'.$search.'" height="888" width="100%" frameborder="0" scrolling="yes" allowfullscreen="true"></iframe>';
				$done='done';
					
				}elseif($linkdomain=='https://beacons.ai/'){
				$aladinurlredirectembed.='<iframe src="https://beacons.ai/'.$search.'" height="888" width="100%" frameborder="0" scrolling="yes" allowfullscreen="true"></iframe>';
				$done='done';
					
				}elseif($linkdomain=='https://twitter.com/'){
					$aladinurlredirectembed.='<a class="twitter-timeline" href="https://twitter.com/'.$search.'?ref_src=twsrc%5Etfw">Tweets by JaredFPS</a><script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>';
						$done='done';	
					}elseif($linkdomain=='https://pinterest.com/'){
					$aladinurlredirectembed.='<a data-pin-do="embedUser" data-pin-board-width="1024" data-pin-scale-height="888" data-pin-scale-width="80" href="https://www.pinterest.com/'.$search.'/">Follow '.$search.' on Pinterest</a><script async defer src="//assets.pinterest.com/js/pinit.js"></script>';
					$done='done';		
					}else
					{
		$checkurl=substr_count($urlnew, '/');
		if($checkurl<=3){
		$curl = curl_init($urlnew);
		curl_setopt($curl, CURLOPT_RETURNTRANSFER, TRUE);
		curl_setopt($curl,CURLOPT_USERAGENT,'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.13) Gecko/20080311 Firefox/2.0.0.13');
		curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
		curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);
		$html = curl_exec($curl);
		$crawler = new Crawler($html);
		$img = $crawler->filter('img')->each(function($node) {
			$src  = $node->attr('src');
			return compact('src');
		});
		$texth1 = $crawler->filter('h1')->each(function($node) {
			$text  = $node->text();
			return compact('text');
		});
		$textp = $crawler->filter('p')->each(function($node) {
			$text  = $node->text();
			return compact('text');
		});
		$textspan = $crawler->filter('span')->each(function($node) {
			$text  = $node->text();
			return compact('text');
		});
		$texth5 = $crawler->filter('h5')->each(function($node) {
			$text  = $node->text();
			return compact('text');
		});
		$links = $crawler->filter('a')->each(function($node) {
			$href  = $node->attr('href');
			$title = $node->attr('title');
			$text  = $node->text();
		
			return compact('href', 'title', 'text');
		});
		
		if($linkdomain=='https://lnk.bio/'){
			
			if(!empty($links))
			{
			$aladinurlredirectembed.='<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Profile Page</title><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"><style>.bodycontaner{font-family:Arial,sans-serif;background:linear-gradient(90deg,rgba(255,223,0,1) 0%,rgba(255,176,0,1) 100%);display:flex;justify-content:center;align-items:center;padding:10px;}.profile-container{background-color:#1a1a1a;border-radius:20px;text-align:center;width:400px;padding:20px;position:relative;box-shadow:0 6px 12px rgba(0,0,0,0.3);transition:all .3s ease}.profile-container:hover{transform:scale(1.02);box-shadow:0 8px 16px rgba(0,0,0,0.4)}.header-bg{width:100%;border-radius:20px 20px 0 0;height:150px;object-fit:cover}.profile-pic{position:absolute;top:80px;left:50%;transform:translateX(-50%);border-radius:50%;overflow:hidden;width:130px;height:130px;border:4px solid #fff;background-color:#000}.profile-pic img{width:100%;height:100%;object-fit:cover}.username{color:#fff;margin-top:50px;font-size:24px;font-weight:700}.real-name{color:#ddd;font-size:16px}.tagline,.description{color:#bbb;margin:5px 0}.social-icons{margin-top:15px}.social-icon{display:inline-block;margin:0 10px;padding:5px;transition:transform .3s ease;font-size:24px;color:#fff}.social-icon:hover{transform:scale(1.2);color:orange}.links{margin-top:20px;display:flex;flex-direction:column;align-items:center}.link-button{display:flex;align-items:center;justify-content:center;background-color:#444;color:#fff;width:90%;padding:12px 0;margin:10px 0;text-decoration:none;border-radius:30px;border:1px solid #555;font-size:16px;font-weight:700;transition:all .3s ease;position:relative}.link-button:hover{background-color:#555;box-shadow:0 4px 8px rgba(0,0,0,0.2)}.link-button::before{content:"";position:absolute;left:15px;width:24px;height:24px;background-image:url(link-icon.png);background-size:cover;background-repeat:no-repeat}@media (max-width: 600px){.profile-container{width:90%}.username{font-size:20px}.real-name{font-size:14px}.link-button{font-size:14px}} </style></head><body><div class="bodycontaner" ><div class="profile-container"> <div class="header"> <img src="'.url('/').'/yellow.webp" alt="Background" class="header-bg"> </div>';
			if(!empty($img)){ 
				$aladinurlredirectembed.='<div class="profile-pic"> <img src="'.$img[0]['src'].'" alt="Profile Picture"></div>';
				} 
			 
				$aladinurlredirectembed.='<h1 class="username">'.$links[10]['text'].'</h1><div class="social-icons"> <a href="#" class="social-icon"><i class="fas fa-envelope"></i></a> <a href="#" class="social-icon"><i class="fab fa-twitter"></i></a> <a href="#" class="social-icon"><i class="fab fa-youtube"></i></a> <a href="#" class="social-icon"><i class="fab fa-facebook"></i></a> </div><div class="links">';
				$done='';
			foreach ($links as $link) {
				if($link['title']=='Get Lnk.Bio')
				{
				 $done='done';
				}
			if($link['title']!='' && $done=='' && $link['text']!='Lnk.Bio'){ 
					$aladinurlredirectembed.='<a href="'.$link['href'].'" class="link-button" target="_blank" >'.$link['text'].'</a>';		
				 }
			} 
			$aladinurlredirectembed.='</div></div></div></body></html>';
			$done='done';
			}
			
		}elseif($linkdomain=='https://campsite.bio/')
		{
			if(!empty($links))
		{
			$aladinurlredirectembed.='<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Profile Page</title><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"><style>.bodycontaner{font-family:Arial,sans-serif;background:linear-gradient(90deg,rgba(255,223,0,1) 0%,rgba(255,176,0,1) 100%);display:flex;justify-content:center;align-items:center;padding:10px;}.profile-container{background-color:#1a1a1a;border-radius:20px;text-align:center;width:400px;padding:20px;position:relative;box-shadow:0 6px 12px rgba(0,0,0,0.3);transition:all .3s ease}.profile-container:hover{transform:scale(1.02);box-shadow:0 8px 16px rgba(0,0,0,0.4)}.header-bg{width:100%;border-radius:20px 20px 0 0;height:150px;object-fit:cover}.profile-pic{position:absolute;top:80px;left:50%;transform:translateX(-50%);border-radius:50%;overflow:hidden;width:130px;height:130px;border:4px solid #fff;background-color:#000}.profile-pic img{width:100%;height:100%;object-fit:cover}.username{color:#fff;margin-top:50px;font-size:24px;font-weight:700}.real-name{color:#ddd;font-size:16px}.tagline,.description{color:#bbb;margin:5px 0}.social-icons{margin-top:15px}.social-icon{display:inline-block;margin:0 10px;padding:5px;transition:transform .3s ease;font-size:24px;color:#fff}.social-icon:hover{transform:scale(1.2);color:orange}.links{margin-top:20px;display:flex;flex-direction:column;align-items:center}.link-button{display:flex;align-items:center;justify-content:center;background-color:#444;color:#fff;width:90%;padding:12px 0;margin:10px 0;text-decoration:none;border-radius:30px;border:1px solid #555;font-size:16px;font-weight:700;transition:all .3s ease;position:relative}.link-button:hover{background-color:#555;box-shadow:0 4px 8px rgba(0,0,0,0.2)}.link-button::before{content:"";position:absolute;left:15px;width:24px;height:24px;background-image:url(link-icon.png);background-size:cover;background-repeat:no-repeat}@media (max-width: 600px){.profile-container{width:90%}.username{font-size:20px}.real-name{font-size:14px}.link-button{font-size:14px}} </style></head><body><div class="bodycontaner" ><div class="profile-container"> <div class="header"> <img src="'.url('/').'/yellow.webp" alt="Background" class="header-bg"> </div>';
			if(!empty($img)){$aladinurlredirectembed.='<div class="profile-pic"><img src="'.$img[0]['src'].'" alt="Profile Picture"></div>';} 
				$aladinurlredirectembed.='<h1 class="username">';
				if(!empty($texth1)){ $aladinurlredirectembed.=$texth1[0]['text']; } 
				$aladinurlredirectembed.='</h1>';
				$aladinurlredirectembed.='<p class="real-name">';
				if(!empty($textp)){ $aladinurlredirectembed.=$textp[0]['text']; } 
				$aladinurlredirectembed.='</p><div class="social-icons"> <a href="#" class="social-icon"><i class="fas fa-envelope"></i></a> <a href="#" class="social-icon"><i class="fab fa-twitter"></i></a> <a href="#" class="social-icon"><i class="fab fa-youtube"></i></a> <a href="#" class="social-icon"><i class="fab fa-facebook"></i></a> </div><div class="links">';
		foreach ($links as $link) {
		if($link['text']!=''){ 
		if(preg_match( '/^(http|https):\\/\\/[a-z0-9]+([\\-\\.]{1}[a-z0-9]+)*\\.[a-z]{2,5}'.'((:[0-9]{1,5})?\\/.*)?$/i' ,$link['href'] . PHP_EOL)){
		$aladinurlredirectembed.='<a href="'.$link['href'].'" class="link-button" target="_blank" >'.$link['text'].'</a>';		
		} }}
		$aladinurlredirectembed.='</div></div></div></body></html>';
		$done='done';
			}
		}elseif($linkdomain=='https://bio.site/')
		{
			if(!empty($links))
		{
			$aladinurlredirectembed.='<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Profile Page</title><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"><style>.bodycontaner{font-family:Arial,sans-serif;background:linear-gradient(90deg,rgba(255,223,0,1) 0%,rgba(255,176,0,1) 100%);display:flex;justify-content:center;align-items:center;padding:10px;}.profile-container{background-color:#1a1a1a;border-radius:20px;text-align:center;width:400px;padding:20px;position:relative;box-shadow:0 6px 12px rgba(0,0,0,0.3);transition:all .3s ease}.profile-container:hover{transform:scale(1.02);box-shadow:0 8px 16px rgba(0,0,0,0.4)}.header-bg{width:100%;border-radius:20px 20px 0 0;height:150px;object-fit:cover}.profile-pic{position:absolute;top:80px;left:50%;transform:translateX(-50%);border-radius:50%;overflow:hidden;width:130px;height:130px;border:4px solid #fff;background-color:#000}.profile-pic img{width:100%;height:100%;object-fit:cover}.username{color:#fff;margin-top:50px;font-size:24px;font-weight:700}.real-name{color:#ddd;font-size:16px}.tagline,.description{color:#bbb;margin:5px 0}.social-icons{margin-top:15px}.social-icon{display:inline-block;margin:0 10px;padding:5px;transition:transform .3s ease;font-size:24px;color:#fff}.social-icon:hover{transform:scale(1.2);color:orange}.links{margin-top:20px;display:flex;flex-direction:column;align-items:center}.link-button{display:flex;align-items:center;justify-content:center;background-color:#444;color:#fff;width:90%;padding:12px 0;margin:10px 0;text-decoration:none;border-radius:30px;border:1px solid #555;font-size:16px;font-weight:700;transition:all .3s ease;position:relative}.link-button:hover{background-color:#555;box-shadow:0 4px 8px rgba(0,0,0,0.2)}.link-button::before{content:"";position:absolute;left:15px;width:24px;height:24px;background-image:url(link-icon.png);background-size:cover;background-repeat:no-repeat}@media (max-width: 600px){.profile-container{width:90%}.username{font-size:20px}.real-name{font-size:14px}.link-button{font-size:14px}} </style></head><body><div class="bodycontaner" ><div class="profile-container"> <div class="header"> <img src="'.url('/').'/yellow.webp" alt="Background" class="header-bg"> </div>';
			if(!empty($img)){ $image=''; foreach ($img as $imgs) { if(@getimagesize($imgs['src']) && $image!='done'){ $image='done';
				$aladinurlredirectembed.='<div class="profile-pic"><img src="'.$imgs['src'].'" alt="Profile Picture"></div>';
				}}} 
				$aladinurlredirectembed.='<h1 class="username">';
				if(!empty($texth1)){ $aladinurlredirectembed.=$texth1[0]['text']; } 
				$aladinurlredirectembed.='</h1>';
				$aladinurlredirectembed.='<p class="real-name">';
				if(!empty($textp)){ $aladinurlredirectembed.=$textp[0]['text']; } 
				$aladinurlredirectembed.='</p><div class="social-icons"> <a href="#" class="social-icon"><i class="fas fa-envelope"></i></a> <a href="#" class="social-icon"><i class="fab fa-twitter"></i></a> <a href="#" class="social-icon"><i class="fab fa-youtube"></i></a> <a href="#" class="social-icon"><i class="fab fa-facebook"></i></a> </div><div class="links">';
		foreach ($links as $link) {
		
		if($link['text']!='' && $link['text']!='Create a free Bio Site'){ 
		if(preg_match( '/^(http|https):\\/\\/[a-z0-9]+([\\-\\.]{1}[a-z0-9]+)*\\.[a-z]{2,5}'.'((:[0-9]{1,5})?\\/.*)?$/i' ,$link['href'] . PHP_EOL)){
		$aladinurlredirectembed.='<a href="'.$link['href'].'" class="link-button" target="_blank" >'.$link['text'].'</a>';		
		} }
		}
		$aladinurlredirectembed.='</div></div></div></body></html>';
		$done='done';
			}
		}elseif($linkdomain=='https://hoo.be/')
		{
			if(!empty($links))
		{
			$aladinurlredirectembed.='<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Profile Page</title><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"><style>.bodycontaner{font-family:Arial,sans-serif;background:linear-gradient(90deg,rgba(255,223,0,1) 0%,rgba(255,176,0,1) 100%);display:flex;justify-content:center;align-items:center;padding:10px;}.profile-container{background-color:#1a1a1a;border-radius:20px;text-align:center;width:400px;padding:20px;position:relative;box-shadow:0 6px 12px rgba(0,0,0,0.3);transition:all .3s ease}.profile-container:hover{transform:scale(1.02);box-shadow:0 8px 16px rgba(0,0,0,0.4)}.header-bg{width:100%;border-radius:20px 20px 0 0;height:150px;object-fit:cover}.profile-pic{position:absolute;top:80px;left:50%;transform:translateX(-50%);border-radius:50%;overflow:hidden;width:130px;height:130px;border:4px solid #fff;background-color:#000}.profile-pic img{width:100%;height:100%;object-fit:cover}.username{color:#fff;margin-top:50px;font-size:24px;font-weight:700}.real-name{color:#ddd;font-size:16px}.tagline,.description{color:#bbb;margin:5px 0}.social-icons{margin-top:15px}.social-icon{display:inline-block;margin:0 10px;padding:5px;transition:transform .3s ease;font-size:24px;color:#fff}.social-icon:hover{transform:scale(1.2);color:orange}.links{margin-top:20px;display:flex;flex-direction:column;align-items:center}.link-button{display:flex;align-items:center;justify-content:center;background-color:#444;color:#fff;width:90%;padding:12px 0;margin:10px 0;text-decoration:none;border-radius:30px;border:1px solid #555;font-size:16px;font-weight:700;transition:all .3s ease;position:relative}.link-button:hover{background-color:#555;box-shadow:0 4px 8px rgba(0,0,0,0.2)}.link-button::before{content:"";position:absolute;left:15px;width:24px;height:24px;background-image:url(link-icon.png);background-size:cover;background-repeat:no-repeat}@media (max-width: 600px){.profile-container{width:90%}.username{font-size:20px}.real-name{font-size:14px}.link-button{font-size:14px}} </style></head><body><div class="bodycontaner" ><div class="profile-container"> <div class="header"> <img src="'.url('/').'/yellow.webp" alt="Background" class="header-bg"> </div>';
			if(!empty($img)){
							$aladinurlredirectembed.='<div class="profile-pic"><img src="https://hoo.be/'.$img[1]['src'].'" alt="Profile Picture"></div>';
			} 
				$aladinurlredirectembed.='<h1 class="username">';
				if(!empty($textspan)){ $aladinurlredirectembed.=$textspan[0]['text']; } 
				$aladinurlredirectembed.='</h1>';
				$aladinurlredirectembed.='<p class="real-name">';
				if(!empty($texth5)){ $aladinurlredirectembed.=$texth5[0]['text']; } 
				$aladinurlredirectembed.='</p><div class="social-icons"> <a href="#" class="social-icon"><i class="fas fa-envelope"></i></a> <a href="#" class="social-icon"><i class="fab fa-twitter"></i></a> <a href="#" class="social-icon"><i class="fab fa-youtube"></i></a> <a href="#" class="social-icon"><i class="fab fa-facebook"></i></a> </div><div class="links">';
		foreach ($links as $link) {
		if($link['text']!='' && strtolower($link['text'])!=strtolower('FacebookFacebook') && strtolower($link['text'])!=strtolower('InstagramInstagram') && strtolower($link['text'])!=strtolower('YouTubeYouTube') && strtolower($link['text'])!=strtolower('EmailEmail') && strtolower($link['text'])!=strtolower('XX') && strtolower($link['text'])!=strtolower('Share on Twitter') && strtolower($link['text'])!=strtolower('Share on Facebook') && isCSS($link['text'])){ 
		if(preg_match( '/^(http|https):\\/\\/[a-z0-9]+([\\-\\.]{1}[a-z0-9]+)*\\.[a-z]{2,5}'.'((:[0-9]{1,5})?\\/.*)?$/i' ,$link['href'] . PHP_EOL)){
		$aladinurlredirectembed.='<a href="'.$link['href'].'" class="link-button" target="_blank" >'.$link['text'].'</a>';		
		} }}
		$aladinurlredirectembed.='</div></div></div></body></html>';
		$done='done';
		}	
		}elseif($linkdomain=='https://linktr.ee/')
		{
		if(!empty($links))
		{
			$aladinurlredirectembed.='<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Profile Page</title><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"><style>.bodycontaner{font-family:Arial,sans-serif;background:linear-gradient(90deg,rgba(255,223,0,1) 0%,rgba(255,176,0,1) 100%);display:flex;justify-content:center;align-items:center;padding:10px;}.profile-container{background-color:#1a1a1a;border-radius:20px;text-align:center;width:400px;padding:20px;position:relative;box-shadow:0 6px 12px rgba(0,0,0,0.3);transition:all .3s ease}.profile-container:hover{transform:scale(1.02);box-shadow:0 8px 16px rgba(0,0,0,0.4)}.header-bg{width:100%;border-radius:20px 20px 0 0;height:150px;object-fit:cover}.profile-pic{position:absolute;top:80px;left:50%;transform:translateX(-50%);border-radius:50%;overflow:hidden;width:130px;height:130px;border:4px solid #fff;background-color:#000}.profile-pic img{width:100%;height:100%;object-fit:cover}.username{color:#fff;margin-top:50px;font-size:24px;font-weight:700}.real-name{color:#ddd;font-size:16px}.tagline,.description{color:#bbb;margin:5px 0}.social-icons{margin-top:15px}.social-icon{display:inline-block;margin:0 10px;padding:5px;transition:transform .3s ease;font-size:24px;color:#fff}.social-icon:hover{transform:scale(1.2);color:orange}.links{margin-top:20px;display:flex;flex-direction:column;align-items:center}.link-button{display:flex;align-items:center;justify-content:center;background-color:#444;color:#fff;width:90%;padding:12px 0;margin:10px 0;text-decoration:none;border-radius:30px;border:1px solid #555;font-size:16px;font-weight:700;transition:all .3s ease;position:relative}.link-button:hover{background-color:#555;box-shadow:0 4px 8px rgba(0,0,0,0.2)}.link-button::before{content:"";position:absolute;left:15px;width:24px;height:24px;background-image:url(link-icon.png);background-size:cover;background-repeat:no-repeat}@media (max-width: 600px){.profile-container{width:90%}.username{font-size:20px}.real-name{font-size:14px}.link-button{font-size:14px}} </style></head><body><div class="bodycontaner" ><div class="profile-container"> <div class="header"> <img src="'.url('/').'/yellow.webp" alt="Background" class="header-bg"> </div>';
			if(!empty($img)){ $image=''; foreach ($img as $imgs) { if(@getimagesize($imgs['src']) && $image!='done'){ $image='done';
				$aladinurlredirectembed.='<div class="profile-pic"> <img src="'.$imgs['src'].'" alt="Profile Picture"> </div>';
				}}} 
				$aladinurlredirectembed.='<h1 class="username">';
				if(!empty($texth1)){ $texth1done=''; foreach ($texth1 as $texth1s) { if(isCSS($texth1s['text']) && $texth1done!='done'){ $texth1done='done'; $aladinurlredirectembed.=$texth1s['text']; session()->put('linkname', trim($texth1s['text'])); }}} 
				$aladinurlredirectembed.='</h1><div class="social-icons"> <a href="#" class="social-icon"><i class="fas fa-envelope"></i></a> <a href="#" class="social-icon"><i class="fab fa-twitter"></i></a> <a href="#" class="social-icon"><i class="fab fa-youtube"></i></a> <a href="#" class="social-icon"><i class="fab fa-facebook"></i></a> </div><div class="links">';
		foreach ($links as $link) {
		if($link['text']!='' && strtolower($link['text'])!=strtolower('FacebookFacebook') && strtolower($link['text'])!=strtolower('InstagramInstagram') && strtolower($link['text'])!=strtolower('YouTubeYouTube') && strtolower($link['text'])!=strtolower('EmailEmail') && strtolower($link['text'])!=strtolower('XX') && strtolower($link['text'])!=strtolower('Share on Twitter') && strtolower($link['text'])!=strtolower('Share on Facebook') && isCSS($link['text'])){ 
		if(preg_match( '/^(http|https):\\/\\/[a-z0-9]+([\\-\\.]{1}[a-z0-9]+)*\\.[a-z]{2,5}'.'((:[0-9]{1,5})?\\/.*)?$/i' ,$link['href'] . PHP_EOL)){
		$aladinurlredirectembed.='<a href="'.$link['href'].'" class="link-button" target="_blank" >'.$link['text'].'</a>';		
		} }}
		$aladinurlredirectembed.='</div></div></div></body></html>';
		$done='done';
		}
		}elseif($linkdomain=='https://portaly.cc/')
		{
		if(!empty($links))
		{
			$aladinurlredirectembed.='<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Profile Page</title><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"><style>.bodycontaner{font-family:Arial,sans-serif;background:linear-gradient(90deg,rgba(255,223,0,1) 0%,rgba(255,176,0,1) 100%);display:flex;justify-content:center;align-items:center;padding:10px;}.profile-container{background-color:#1a1a1a;border-radius:20px;text-align:center;width:400px;padding:20px;position:relative;box-shadow:0 6px 12px rgba(0,0,0,0.3);transition:all .3s ease}.profile-container:hover{transform:scale(1.02);box-shadow:0 8px 16px rgba(0,0,0,0.4)}.header-bg{width:100%;border-radius:20px 20px 0 0;height:150px;object-fit:cover}.profile-pic{position:absolute;top:80px;left:50%;transform:translateX(-50%);border-radius:50%;overflow:hidden;width:130px;height:130px;border:4px solid #fff;background-color:#000}.profile-pic img{width:100%;height:100%;object-fit:cover}.username{color:#fff;margin-top:50px;font-size:24px;font-weight:700}.real-name{color:#ddd;font-size:16px}.tagline,.description{color:#bbb;margin:5px 0}.social-icons{margin-top:15px}.social-icon{display:inline-block;margin:0 10px;padding:5px;transition:transform .3s ease;font-size:24px;color:#fff}.social-icon:hover{transform:scale(1.2);color:orange}.links{margin-top:20px;display:flex;flex-direction:column;align-items:center}.link-button{display:flex;align-items:center;justify-content:center;background-color:#444;color:#fff;width:90%;padding:12px 0;margin:10px 0;text-decoration:none;border-radius:30px;border:1px solid #555;font-size:16px;font-weight:700;transition:all .3s ease;position:relative}.link-button:hover{background-color:#555;box-shadow:0 4px 8px rgba(0,0,0,0.2)}.link-button::before{content:"";position:absolute;left:15px;width:24px;height:24px;background-image:url(link-icon.png);background-size:cover;background-repeat:no-repeat}@media (max-width: 600px){.profile-container{width:90%}.username{font-size:20px}.real-name{font-size:14px}.link-button{font-size:14px}} </style></head><body><div class="bodycontaner" ><div class="profile-container"> <div class="header"> <img src="'.url('/').'/yellow.webp" alt="Background" class="header-bg"> </div>';
			if(!empty($img)){ $image=''; foreach ($img as $imgs) { if(@getimagesize($imgs['src']) && $image!='done'){ $image='done';
				$aladinurlredirectembed.='<div class="profile-pic"><img src="'.$imgs['src'].'" alt="Profile Picture"></div>';
				}}} 
				$aladinurlredirectembed.='<h1 class="username">';
				if(!empty($texth1)){ $texth1done=''; foreach ($texth1 as $texth1s) { if(isCSS($texth1s['text']) && $texth1done!='done'){ $texth1done='done'; $aladinurlredirectembed.=$texth1s['text']; session()->put('linkname', trim($texth1s['text'])); }}} 
				$aladinurlredirectembed.='</h1>';
				$aladinurlredirectembed.='<p class="real-name">';
				if(!empty($textp)){ $aladinurlredirectembed.=$textp[0]['text']; }
				$aladinurlredirectembed.='</p><div class="social-icons"> <a href="#" class="social-icon"><i class="fas fa-envelope"></i></a> <a href="#" class="social-icon"><i class="fab fa-twitter"></i></a> <a href="#" class="social-icon"><i class="fab fa-youtube"></i></a> <a href="#" class="social-icon"><i class="fab fa-facebook"></i></a> </div><div class="links">';
		foreach ($links as $link) {
		if($link['text']!='' && strtolower($link['text'])!=strtolower('FacebookFacebook') && strtolower($link['text'])!=strtolower('InstagramInstagram') && strtolower($link['text'])!=strtolower('YouTubeYouTube') && strtolower($link['text'])!=strtolower('EmailEmail') && strtolower($link['text'])!=strtolower('XX') && strtolower($link['text'])!=strtolower('Share on Twitter') && strtolower($link['text'])!=strtolower('Share on Facebook') && isCSS($link['text'])){ 
		if(preg_match( '/^(http|https):\\/\\/[a-z0-9]+([\\-\\.]{1}[a-z0-9]+)*\\.[a-z]{2,5}'.'((:[0-9]{1,5})?\\/.*)?$/i' ,$link['href'] . PHP_EOL)){
		$aladinurlredirectembed.='<a href="'.$link['href'].'" class="link-button" target="_blank" >'.$link['text'].'</a>';		
		} }}
		$aladinurlredirectembed.='</div></div></div></body></html>';
		$done='done';
		}
		}elseif($linkdomain=='https://link3.cc/')
		{
		$aladinurlredirectembed.='<iframe loading="lazy" allow="camera; microphone; fullscreen; display-capture; autoplay" style="border: 0;" src="'.$linkdomain.$search.'" width="100%" height="888px" allowfullscreen="allowfullscreen" ></iframe>';	
		$done='done';
		}
		
					}
				}	
			}
		}
			if($done!='done')
			{
		if (filter_var($request->url, FILTER_VALIDATE_URL)) {
				$isFriendly = IframeHelper::isIframeable($request->url);
			if ($isFriendly) {
				$themeData['image'] = $request->url;	
			} else {
				$fullImageUrl = $request->url;
				$validImageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'tif', 'webp', 'apng', 'svg', 'ico'];
				$validDocumentExtensions = ['ppt', 'pptx', 'pdf', 'xls', 'xlsx', 'doc', 'docx', 'pages', 'ai', 'psd', 'eps', 'ttf', 'dxf', 'xps', 'rar', 'zip', 'ods', 'odt', 'odp'];

				// Check file extension first
				$urlPath = parse_url($fullImageUrl, PHP_URL_PATH);
				$extension = pathinfo($urlPath, PATHINFO_EXTENSION);

				if (in_array(strtolower($extension), array_merge($validImageExtensions, $validDocumentExtensions))) {
					$themeData['image'] = $request->url;
				}else{
				$patterns = [
								'/(?:youtube(?:-nocookie)?\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/i',
								'/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|posts|company|feed|showcase|embed\/feed\/update\/urn:li:[^\/]+:[^"&?\/ ]+)/i',
								'/^https?:\/\/(?:www\.|player\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)(?:[?]?.*)$/im',
								'/^(https?:\/\/)?(www\.)?fb\.watch\/[a-zA-Z0-9(\.\?)?]/',
								'/^(https?:\/\/)?(www\.)?facebook\.com\/[a-zA-Z0-9(\.\?)?]/',
								'/<iframe.*?src=["\'](.*?)["\'].*?>.*?<\/iframe>/is',
								'/<blockquote/',
								'/reddit\.com\/r\/\w+\/comments\/\w+\/\w+\//',
								'/reddit-embed-bq/'
							];

							// Check if any pattern matches
							$isValid = false;
							foreach ($patterns as $pattern) {
								if (preg_match($pattern, $request->url)) {
									$isValid = true;
									break;
								}
							}

							if (!$isValid) {
								$str = ['{backimage}','{backcolor}','{favicon}','{providerName}','{loadingurl}','{image}','{title}','{description}'];
								$curl = curl_init('https://api.microlink.io/?url='.$request->url);
								curl_setopt($curl, CURLOPT_RETURNTRANSFER, TRUE);
								curl_setopt($curl,CURLOPT_USERAGENT,'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.13) Gecko/20080311 Firefox/2.0.0.13');
								$page = curl_exec($curl);
								$arraypage=array_values(json_decode($page, true));
								$publisher='';
								$logo='';
								$urlpage='';
								$image='';
								$title='';
								$description='';
								if($arraypage[1]['publisher']!=null)
								{
								$publisher=$arraypage[1]['publisher'];	
								}
								if($arraypage[1]['logo']!=null)
								{
								$logo=$arraypage[1]['logo']['url'];
								}
								if($arraypage[1]['url']!=null)
								{
								$urlpage=$arraypage[1]['url'];
								}
								if($arraypage[1]['image']!=null)
								{
								$image=$arraypage[1]['image']['url'];
								}
								if($arraypage[1]['title']!=null)
								{
								$title=$arraypage[1]['title'];
								}
								if($arraypage[1]['description']!=null)
								{
								$description=$arraypage[1]['description'];
								}
								$fav='<img src="'.$logo.'" width="20px;" >';
								$rplc =['','',$fav,$publisher,$urlpage,printImage($image),printText($title),printText($description)];
								$code = Page::where('id',1)->value('code');
								$divstr=str_replace($str,$rplc,$code);
								$themeData['image'] = $divstr;
							}else
							{
							$themeData['image'] = $request->url;	
							}
				}
			}
			} else {
				$themeData['image'] = $request->url;
			}
			}else
			{
				$themeData['image'] = $aladinurlredirectembed;
			}
    }
    // If neither file nor URL provided, keep existing image

    $theme->update($themeData);

    return response()->json([
        'message' => 'Theme updated successfully',
        'theme' => $theme->fresh() // Get refreshed model
    ]);
}

public function destroy($themeId)
{
    try {
        $theme = Template::where('unique_id', $themeId)->firstOrFail();
        
        if ($theme->user_id !== auth()->id()) {
            abort(403, 'Unauthorized action');
        }

        // Delete associated file if it's not a URL
		if ($theme->image && file_exists(public_path($theme->image))) {
            unlink(public_path($theme->image));
        }

        $theme->delete();

        return response()->noContent();

    } catch (\Exception $e) {
        \Log::error('Theme deletion error: ' . $e->getMessage());
        return response()->json([
            'message' => 'Error deleting theme'
        ], 500);
    }
}

public function getTemplates()
{
    $userTemplates = [];
    $defaultTemplates = [];
    $themeCollections = [];

    if (auth()->check()) {
        $userId = auth()->id();
        
        // Get user templates and default templates
        $templates = Template::where('status', 'Active')
            ->whereIn('user_id', [$userId, 0])
            ->orderBy('id', 'desc')
            ->get()
            ->groupBy('user_id');
            
        $userTemplates = $templates->get($userId, collect())->toArray();
        $defaultTemplates = $templates->get(0, collect())->toArray();

        // Get theme collections with additional info
        $themeCollections = Themecollection::with('template')
            ->where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function($collection) {
                return $collection->template;
            })
            ->filter() // Remove nulls if any
            ->values() // Reset keys
            ->toArray();
    }

    return response()->json([
        'userTemplates' => $userTemplates,
        'defaultTemplates' => $defaultTemplates,
        'themecollections' => $themeCollections,
    ]);
}

public function getTemplatespaid()
{
    $userTemplates = [];
    $defaultTemplates = [];
    $paidTemplates = [];

    if (auth()->check()) {
        // Your Templates
        $userTemplates = Template::where('status', 'Active')
            ->where('user_id', auth()->id())
            ->orderBy('id', 'desc')
            ->get()
            ->toArray();

        // Default Templates (user_id = 0)
        $defaultTemplates = Template::where('status', 'Active')
            ->where('user_id', 0)
            ->orderBy('id', 'desc')
            ->get()
            ->toArray();

        // Paid Templates (user_id != 0 and not current user)
        $paidTemplates = Template::where('status', 'Active')
            ->where('user_id', '!=', 0)
            ->where('user_id', '!=', auth()->id())
            ->orderBy('id', 'desc')
            ->get()
            ->toArray();
    }

    return response()->json([
        'userTemplates' => $userTemplates,
        'defaultTemplates' => $defaultTemplates,
        'paidTemplates' => $paidTemplates
    ]);
}

public function checkCollection($themeId)
{
    if (!auth()->check()) {
        return response()->json(['isInCollection' => false]);
    }

    $exists = Themecollection::where('user_id', auth()->id())
        ->where('theme_id', $themeId)
        ->exists();

    return response()->json(['isInCollection' => $exists]);
}

public function addToCollection(Request $request)
{
    if (!auth()->check()) {
        abort(403, 'Unauthorized');
    }

    $request->validate([
        'theme_id' => 'required|exists:templates,id'
    ]);

    // Check if already in collection
    $exists = Themecollection::where('user_id', auth()->id())
        ->where('theme_id', $request->theme_id)
        ->exists();

    if ($exists) {
        return response()->json(['message' => 'Theme already in collection']);
    }

    Themecollection::create([
        'user_id' => auth()->id(),
        'theme_id' => $request->theme_id
    ]);

    return response()->json(['message' => 'Theme added to collection']);
}

public function ezhandleavalablecheck(Request $request)
{
    $request->validate([
        'domain' => 'required|string',
        'handle' => 'required|string',
        'current_funnel_id' => 'required|integer'
    ]);

    $domain = $request->input('domain');
    $handle = $request->input('handle');
    $currentFunnelId = $request->input('current_funnel_id');

    // Check if handle is already taken
    $funnelExists = EzFunnel::where('token', $handle)->exists();
        
    $reserved = Reserve::where('reserve', $handle)->exists();
    $domainExists = Customdomain::whereRaw('BINARY `domain` = ?', [$handle])
        ->where('domainselected', $domain)
        ->exists();
	$charCount = iconv_strlen(str_replace(' ', '', urldecode($handle)),'UTF-8');
	/*if ($charCount<=3) {
        return response()->json([
            'available' => false,
            'message' => 'This handle is Reserve.'
        ], 200);
    }*/

    if ($funnelExists || $reserved || $domainExists) {
        return response()->json([
            'available' => false,
            'message' => 'This handle is not available'
        ], 200);
    }

    // Calculate price based on character count
    $priceString = Powerstring::where('min_word', '<=', $charCount)
        ->where('max_word', '>=', $charCount)
        ->first();

    $price = $priceString ? $priceString->custom_price : 0;
    $promoPrice = 0; // Pre-launch promotion price

    return response()->json([
        'available' => true,
        'message' => 'Handle is available',
        'charCount' => $charCount,
        'price' => $price,
        'promoPrice' => $promoPrice,
        'handle' => $handle,
        'domain' => $domain
    ]);
}

public function couponcodecustom(Request $request)
{
    $request->validate([
        'couponcode' => 'required|string',
        'domainurl' => 'required|string',
		'type' => 'required|string'
    ]);

    $pricestring = Powerstring::get()->toArray();
    $value = iconv_strlen(str_replace(' ', '', urldecode($request->domainurl)),'UTF-8');
    $wordprice = 0;
    $price = 0;
    
    if($request->type=='domain')
	{
    // Calculate base price
    foreach ($pricestring as $priceTier) {
        if(($value >= $priceTier['min_word']) && ($value <= $priceTier['max_word'])) {
            $wordprice = $priceTier['dollar_price'] * 1;
            $price = $priceTier['dollar_price'];
            break;
        }
    }
	}else
	{
	// Calculate base price
    foreach ($pricestring as $priceTier) {
        if(($value >= $priceTier['min_word']) && ($value <= $priceTier['max_word'])) {
            $wordprice = $priceTier['custom_price'] * 1;
            $price = $priceTier['custom_price'];
            break;
        }
    }	
	}

    $response = [
        'original_price' => $price,
        'offprice' => $price, // default to original price
        'title' => '',
        'valid' => false
    ];

    $coupon = Coupon::where('coupon', urldecode($request->couponcode))->first();
    
    if($coupon) {
        $response['valid'] = true;
        $response['title'] = $coupon['title'];
        
        if($coupon['type'] == 'percentage') {
            $response['title'] .= ' '.$coupon['offer'].'% off';
            $response['offprice'] = $price - ($price * ($coupon['offer'] / 100));
        }
        elseif($coupon['type'] == 'all') {
            $response['offprice'] = $coupon['offer'];
        }
    }

    return response()->json($response);
}

public function updateEzFunnelHandle(Request $request, $id)
{
    try {
        $validated = $request->validate([
            'custom_handle' => 'required|string',
            'domain' => 'required|string',
            'price' => 'required|numeric|min:0',
            'promo_price' => 'required|numeric|min:0',
            'coupon_code' => 'nullable|string',
            'selling_price' => 'nullable|numeric|min:0',
            'payment_method' => 'required|in:bee,usd'
        ]);
        
        $user = Auth::user();
        $customHandle = strtolower(trim($validated['custom_handle']));
        $domain = $validated['domain'];
        $funnelId = $id;
        $paymentMethod = $validated['payment_method'];
        
        // Determine the actual price to use based on promo_price
        $actualPrice = $validated['promo_price'] > 0 ? $validated['promo_price'] : $validated['price'];
        $couponCode = $validated['coupon_code'] ?? null;
		$coupon = Coupon::where('coupon', urldecode($couponCode))->first();
		if($coupon) {
			if($coupon['type'] == 'percentage') {
				$actualPrice = $actualPrice - ($actualPrice * ($coupon['offer'] / 100));
			}
			elseif($coupon['type'] == 'all') {
				$actualPrice = $coupon['offer'];
			}
		}
		if ($couponCode) {
				$coupon = Coupon::where('coupon', $couponCode)->first();
				
				if (!$coupon) {
					return response()->json([
						'error' => 'Invalid coupon code.'
					], 400);
				}
				
				if (!$coupon->isValidForUser($user->id)) {
					if ($coupon->status !== 'Active') {
						return response()->json([
							'error' => 'This coupon is not active.'
						], 400);
					}
					if ($coupon->limit_type === 'limited' && $coupon->getUsageCountAttribute() >= $coupon->use_limit) {
						return response()->json([
							'error' => 'This coupon has reached its usage limit.'
						], 400);
					}
				}
				
			}
        // Check if handle already exists
        $existingLink = Customdomain::whereRaw('BINARY `domain` = ?', [$customHandle])
            ->where('domainselected', $domain)
            ->first();

        if ($existingLink && $existingLink->user_id !== $user->id) {
            return response()->json([
                'error' => 'This handle is already taken',
                'available' => false
            ], 409);
        }

        // Check user balance if paying with Bee points
        if ($paymentMethod === 'bee') {
            $userBalance = UserBalance::where('user_id', $user->id)->first();
            if (!$userBalance || $userBalance->bee_points_balance < $actualPrice) {
                return response()->json([
                    'error' => 'Insufficient EZ$ points balance',
                    'available' => false
                ], 400);
            }
        }

        // Get the original funnel
        $funnel = EzFunnel::findOrFail($funnelId);

        // Create custom domain record
        $expiryDate = now()->addYear();
        
        $customDomain = Customdomain::create([
			'domain' => $customHandle,
			'domainselected' => $domain,
			'user_id' => $user->id,
			'funnelid' => $funnelId,
			'hashtag' => $funnel->seo_tag,
			'expire' => $expiryDate,
		]);

        // Create sales record if selling price provided
        if (!empty($validated['selling_price'])) {
            Sell::updateOrCreate(
                [
                    'sellid' => $customDomain->id,
                    'type' => 'CUSTOM',
                    'user_id' => $user->id
                ],
                [
                    'uniquesellid' => time(),
                    'price' => $validated['selling_price'],
                    'expire' => $expiryDate
                ]
            );
        }
        
        // Record the purchase
        $handlePurchase = HandlePurchase::create([
            'user_id' => $user->id,
            'customdomain_id' => $customDomain->id,
            'amount' => $actualPrice,
            'currency' => 'USD',
            'bee_points_amount' => $paymentMethod === 'bee' ? $actualPrice : null,
            'payment_method' => $paymentMethod,
            'coupon_code' => $couponCode,
            'discount_amount' => $validated['promo_price'],
            'status' => 'completed',
            'transaction_id' => 'HNDL-' . strtoupper(Str::random(8))
        ]);
        if ($coupon) {
				  CouponUsage::create([
                    'coupon_id' => $coupon->id,
                    'user_id' => $user->id,
                    'coupon_code' => $coupon->coupon,
                    'used_at' => now(),
                ]);
			}
        // Create invoice
        $invoice = $handlePurchase->invoice()->create([
            'invoice_number' => 'INV-HNDL-' . strtoupper(Str::random(8)),
            'user_id' => $user->id,
            'handle_purchase_id' => $handlePurchase->id,
            'issue_date' => now(),
            'due_date' => now()->addDays(30),
            'amount' => $actualPrice,
            'status' => 'paid',
            'items' => [
                [
                    'description' => "Custom Handle Purchase: {$customHandle}.{$domain}",
                    'quantity' => 1,
                    'unit_price' => $actualPrice,
                    'amount' => $actualPrice,
                ]
            ],
            'notes' => 'Thank you for your purchase!',
        ]);

        // Deduct Bee points if that was the payment method
        if ($paymentMethod === 'bee') {
            $userBalance->decrement('bee_points_balance', $actualPrice);
            
            // Record token transaction
            TokenTransaction::create([
                'user_id' => $user->id,
                'amount' => -$actualPrice, // Negative for deduction
                'transaction_type' => 'handle_purchase',
                'custom_id' => $handlePurchase->id,
                'balance_before' => $userBalance->bee_points_balance + $actualPrice,
                'balance_after' => $userBalance->bee_points_balance,
            ]);
			$tokenInfo = TokenInfo::first();
			$tokenInfo->reserved_supply += $actualPrice;
			$tokenInfo->last_updated = now();
			$tokenInfo->save();
			
			$transaction = ReserveTransaction::create([
                'transaction_type' => 'reserve',
                'amount' => $actualPrice,
                'reason' => 'Purchase Custom Domain',
                'reference_id' => 'RES-' . Str::upper(Str::random(8)),
                'user_id' => $user->id,
				'admin_id' => 2
            ]);

            // Generate invoice
            InvoiceService::createForReserveTransaction($transaction);
			
        }
			$fullDomain='https://'.$domain.'/'.$customHandle;
			$emaildesign = Emaildesign::where('id', 22)->first();
            $str = ['{fullDomain}', '{amount}', '{invoiceNumber}', '{purchaseDate}', '{payment}'];
            $rplc = [$fullDomain, $actualPrice, $invoice->invoice_number, now(), 'EZ$'];
            $div = str_replace($str, $rplc, $emaildesign['design']);
            $mailData = ['design' => $div];
            
            try {
                $subject = "Ez.wiki Congratulations on your new Custom Domain.";
                Mail::to(strtolower($user->email))->send(new Eznew($mailData, $subject));
				Mail::getSymfonyTransport()->stop();
            } catch (\Exception $e) {
                $subject = "Ez.wiki Congratulations on your new Custom Domain.";
                @mail($user->email, $subject, $div, null, 'funnel@ez.wiki');
            }
        return response()->json([
            'success' => true,
            'url' => "https://{$domain}/{$customHandle}",
            'html' => '<a href="https://'.$domain.'/'.$customHandle.'" target="_blank" class="btn btn-warning reloadcreatenew">https://'.$domain.'/'.$customHandle.'</a>',
            'available' => true
        ]);

    } catch (ValidationException $e) {
        return response()->json([
            'error' => 'Validation failed',
            'messages' => $e->errors()
        ], 422);
    } catch (\Exception $e) {
        Log::error('Failed to update funnel handle: ' . $e->getMessage());
        return response()->json([
            'error' => 'Failed to process your request',
            'message' => $e->getMessage()
        ], 500);
    }
}

private function generateSuccessResponse(string $handle, string $domain)
{
    $url = "https://{$domain}/{$handle}";
    return response()->json([
        'success' => true,
        'url' => $url,
        'html' => '<a href="'.$url.'" target="_blank" class="btn btn-warning reloadcreatenew">'.$url.'</a>',
        'available' => true
    ]);
}

public function ezdomain()
{
    $template = Frontpage::where('frontpages.id', 1)
        ->join('templates', 'frontpages.theme_id', '=', 'templates.id')
        ->select('templates.*')
        ->first();
    
    // Get user's funnels with pagination
    $funnels = EzFunnel::where('user_id', auth()->id())
        ->with(['fields', 'customDomains'])
		->with(['fields', 'handleDomains'])
        ->orderBy('created_at', 'desc')
        ->paginate(10);

    // Debug the data structure being sent to frontend
    logger('Funnels data:', [
        'first_funnel' => $funnels->first() ? $funnels->first()->toArray() : null,
        'custom_domains_count' => $funnels->first() ? $funnels->first()->customDomains->count() : 0,
		'handle_domains_count' => $funnels->first() ? $funnels->first()->handleDomains->count() : 0
    ]);
	
	$dayOfWeek = strtolower(Carbon::now()->format('D'));
	$domains = Admindomain::where('status', 'Active')
						->where(function ($query) use ($dayOfWeek) {
							$query->where('days', 'all') // Show domains for all days
								->orWhere('days', 'LIKE', "%$dayOfWeek%"); // Show domains for the current day
						})
						->orderBy('domain', 'ASC')
						->get(['domain']);
	$tokenInfo = TokenInfo::first();
	$promoprice=0;					
    return Inertia::render('ezdomain', [
        'template' => $template,
        'auth' => [
            'user' => auth()->user() ?? null
        ],
		'tokenInfo' => $tokenInfo,
        'initialFunnels' => $funnels,
		'domains' => $domains,
		'promoprice' => $promoprice
    ]);
}

public function ezdomainavalablecheck(Request $request)
{
    $request->validate([
        'domain' => 'required|string',
        'handle' => 'required|string',
        'current_funnel_id' => 'required|integer'
    ]);

    $domain = $request->input('domain');
    $handle = $request->input('handle');
    $currentFunnelId = $request->input('current_funnel_id');

    // Check if handle is already taken
    $funnelExists = EzFunnel::where('token', $handle)->exists();
        
    $reserved = Reserve::where('reserve', $handle)->exists();
    $domainExists = Domain::whereRaw('BINARY `domain` = ?', [$handle])
        ->where('domainselected', $domain)
        ->exists();
	$charCount = iconv_strlen(str_replace(' ', '', urldecode($handle)),'UTF-8');
	/*if ($charCount<=3) {
        return response()->json([
            'available' => false,
            'message' => 'This handle is Reserve.'
        ], 200);
    }*/

    if ($funnelExists || $reserved || $domainExists) {
        return response()->json([
            'available' => false,
            'message' => 'This handle is not available'
        ], 200);
    }

    // Calculate price based on character count
    $priceString = Powerstring::where('min_word', '<=', $charCount)
        ->where('max_word', '>=', $charCount)
        ->first();

    $price = $priceString ? $priceString->dollar_price : 0;
    $promoPrice = 0; // Pre-launch promotion price

    return response()->json([
        'available' => true,
        'message' => 'Handle is available',
        'charCount' => $charCount,
        'price' => $price,
        'promoPrice' => $promoPrice,
        'handle' => $handle,
        'domain' => $domain
    ]);
}

public function updateEzdomainFunnelHandle(Request $request, $id)
{

    try {
        $validated = $request->validate([
            'custom_handle' => 'required|string',
            'domain' => 'required|string',
            'price' => 'required|numeric|min:0',
            'promo_price' => 'required|numeric|min:0',
            'coupon_code' => 'nullable|string',
            'selling_price' => 'nullable|numeric|min:0',
            'payment_method' => 'required|in:bee,usd'
        ]);
        
        $user = Auth::user();
        $customHandle = strtolower(trim($validated['custom_handle']));
        $domain = $validated['domain'];
        $funnelId = $id;
        $paymentMethod = $validated['payment_method'];
        
        // Determine the actual price to use based on promo_price
        $actualPrice = $validated['promo_price'] > 0 ? $validated['promo_price'] : $validated['price'];
        $couponCode = $validated['coupon_code'] ?? null;
		$coupon = Coupon::where('coupon', urldecode($couponCode))->first();
		if($coupon) {
			if($coupon['type'] == 'percentage') {
				$actualPrice = $actualPrice - ($actualPrice * ($coupon['offer'] / 100));
			}
			elseif($coupon['type'] == 'all') {
				$actualPrice = $coupon['offer'];
			}
		}
		if ($couponCode) {
				$coupon = Coupon::where('coupon', $couponCode)->first();
				
				if (!$coupon) {
					return response()->json([
						'error' => 'Invalid coupon code.'
					], 400);
				}
				
				if (!$coupon->isValidForUser($user->id)) {
					if ($coupon->status !== 'Active') {
						return response()->json([
							'error' => 'This coupon is not active.'
						], 400);
					}
					if ($coupon->limit_type === 'limited' && $coupon->getUsageCountAttribute() >= $coupon->use_limit) {
						return response()->json([
							'error' => 'This coupon has reached its usage limit.'
						], 400);
					}
				}
				
			}
        // Check if handle already exists
        $existingLink = Domain::whereRaw('BINARY `domain` = ?', [$customHandle])
            ->where('domainselected', $domain)
            ->first();

        if ($existingLink && $existingLink->user_id !== $user->id) {
            return response()->json([
                'error' => 'This handle is already taken',
                'available' => false
            ], 409);
        }

        // Check user balance if paying with Bee points
        if ($paymentMethod === 'bee') {
            $userBalance = UserBalance::where('user_id', $user->id)->first();
            if (!$userBalance || $userBalance->bee_points_balance < $actualPrice) {
                return response()->json([
                    'error' => 'Insufficient EZ$ points balance',
                    'available' => false
                ], 400);
            }
        }

        // Get the original funnel
        $funnel = EzFunnel::findOrFail($funnelId);

        // Create custom domain record
        $expiryDate = now()->addYear();
        
        $customDomain = Domain::create([
			'domain' => $customHandle,
			'domainselected' => $domain,
			'user_id' => $user->id,
			'funnelid' => $funnelId,
			'hashtag' => $funnel->seo_tag,
			'expire' => $expiryDate,
		]);

        // Create sales record if selling price provided
        if (!empty($validated['selling_price'])) {
            Sell::updateOrCreate(
                [
                    'sellid' => $customDomain->id,
                    'type' => 'DOMAIN',
                    'user_id' => $user->id
                ],
                [
                    'uniquesellid' => time(),
                    'price' => $validated['selling_price'],
                    'expire' => $expiryDate
                ]
            );
        }
        
        // Record the purchase
        $handlePurchase = HandlePurchase::create([
            'user_id' => $user->id,
            'domain_id' => $customDomain->id,
            'amount' => $actualPrice,
            'currency' => 'USD',
            'bee_points_amount' => $paymentMethod === 'bee' ? $actualPrice : null,
            'payment_method' => $paymentMethod,
            'coupon_code' => $couponCode,
            'discount_amount' => $validated['promo_price'],
            'status' => 'completed',
            'transaction_id' => 'HNDL-' . strtoupper(Str::random(8))
        ]);
        if ($coupon) {
				  CouponUsage::create([
                    'coupon_id' => $coupon->id,
                    'user_id' => $user->id,
                    'coupon_code' => $coupon->coupon,
                    'used_at' => now(),
                ]);
			}
        // Create invoice
        $invoice = $handlePurchase->invoice()->create([
            'invoice_number' => 'INV-HNDL-' . strtoupper(Str::random(8)),
            'user_id' => $user->id,
            'handle_purchase_id' => $handlePurchase->id,
            'issue_date' => now(),
            'due_date' => now()->addDays(30),
            'amount' => $actualPrice,
            'status' => 'paid',
            'items' => [
                [
                    'description' => "Domain Handle Purchase: {$customHandle}.{$domain}",
                    'quantity' => 1,
                    'unit_price' => $actualPrice,
                    'amount' => $actualPrice,
                ]
            ],
            'notes' => 'Thank you for your purchase!',
        ]);

        // Deduct Bee points if that was the payment method
        if ($paymentMethod === 'bee') {
            $userBalance->decrement('bee_points_balance', $actualPrice);
            
            // Record token transaction
            TokenTransaction::create([
                'user_id' => $user->id,
                'amount' => -$actualPrice, // Negative for deduction
                'transaction_type' => 'handle_purchase',
                'domain_id' => $handlePurchase->id,
                'balance_before' => $userBalance->bee_points_balance + $actualPrice,
                'balance_after' => $userBalance->bee_points_balance,
            ]);
			
			$tokenInfo = TokenInfo::first();
			$tokenInfo->reserved_supply += $actualPrice;
			$tokenInfo->last_updated = now();
			$tokenInfo->save();
			
			$transaction = ReserveTransaction::create([
                'transaction_type' => 'reserve',
                'amount' => $actualPrice,
                'reason' => 'Purchase Custom Domain',
                'reference_id' => 'RES-' . Str::upper(Str::random(8)),
                'user_id' => $user->id,
				'admin_id' => 2
            ]);

            // Generate invoice
            InvoiceService::createForReserveTransaction($transaction);
			
        }
			$fullDomain='https://'.$customHandle.'.'.$domain;
			$emaildesign = Emaildesign::where('id', 23)->first();
            $str = ['{fullDomain}', '{amount}', '{invoiceNumber}', '{purchaseDate}', '{payment}'];
            $rplc = [$fullDomain, $actualPrice, $invoice->invoice_number, now(), 'EZ$'];
            $div = str_replace($str, $rplc, $emaildesign['design']);
            $mailData = ['design' => $div];
            
            try {
                $subject = "Ez.wiki Congratulations on your new Domain.";
                Mail::to(strtolower($user->email))->send(new Eznew($mailData, $subject));
				Mail::getSymfonyTransport()->stop();
            } catch (\Exception $e) {
                $subject = "Ez.wiki Congratulations on your new Domain.";
                @mail($user->email, $subject, $div, null, 'funnel@ez.wiki');
            }
        return response()->json([
            'success' => true,
            'url' => "https://{$customHandle}.{$domain}",
            'html' => '<a href="https://'.$customHandle.'.'.$domain.'" target="_blank" class="btn btn-warning reloadcreatenew">https://'.$customHandle.'.'.$domain.'</a>',
            'available' => true
        ]);

    } catch (ValidationException $e) {
        return response()->json([
            'error' => 'Validation failed',
            'messages' => $e->errors()
        ], 422);
    } catch (\Exception $e) {
        Log::error('Failed to update funnel handle: ' . $e->getMessage());
        return response()->json([
            'error' => 'Failed to process your request',
            'message' => $e->getMessage()
        ], 500);
    }
}

private function generateDomainSuccessResponse(string $handle, string $domain)
{
    $url = "https://{$handle}.{$domain}";
    return response()->json([
        'success' => true,
        'url' => $url,
        'html' => '<a href="'.$url.'" target="_blank" class="btn btn-warning reloadcreatenew">'.$url.'</a>',
        'available' => true
    ]);
}

public function storelikedislike(Request $request)
    {
        $request->validate([
            'funnelid' => 'required',
            'reaction' => 'required|in:like,dislike',
        ]);

        $ip = $request->ip();

        // Check if this IP already reacted to this funnel
        $existingReaction = Reaction::where('funnelid', $request->funnelid)
            ->where('ip', $ip)
            ->first();

        if ($existingReaction) {
            // If same reaction, remove it (toggle)
            if ($existingReaction->reaction === $request->reaction) {
                $existingReaction->delete();
                $action = 'removed';
            } else {
                // If different reaction, update it
                $existingReaction->update(['reaction' => $request->reaction]);
                $action = 'updated';
            }
        } else {
            // Create new reaction
            Reaction::create([
                'funnelid' => $request->funnelid,
                'ip' => $ip,
                'reaction' => $request->reaction
            ]);
            $action = 'added';
        }

        // Get updated counts
        $likes = Reaction::where('funnelid', $request->funnelid)
            ->where('reaction', 'like')
            ->count();

        $dislikes = Reaction::where('funnelid', $request->funnelid)
            ->where('reaction', 'dislike')
            ->count();

        return response()->json([
            'status' => 'success',
            'action' => $action,
            'likes' => $likes,
            'dislikes' => $dislikes,
        ]);
    }

    public function getCounts($funnelid)
    {
        $likes = Reaction::where('funnelid', $funnelid)
            ->where('reaction', 'like')
            ->count();

        $dislikes = Reaction::where('funnelid', $funnelid)
            ->where('reaction', 'dislike')
            ->count();

        return response()->json([
            'likes' => $likes,
            'dislikes' => $dislikes,
        ]);
    }

	public function domainfunnel(string $query)
	{
	$funnelid = idn_to_utf8($query);
	/*marketplace code */
	$query = [
            'min_price' => '',
            'max_price' => '',
            'search' => '',
        ];

        $template = Frontpage::where('frontpages.id', 1)
                ->join('templates', 'frontpages.theme_id', '=', 'templates.id')
                ->select('templates.*')
                ->first();

        // Main query with pagination
			$sellsQuery = Sell::with([
			'handleDomain' => function($q) {
				$q->select(['id', 'user_id', 'domain', 'domainselected', 'hashtag', 'email'])
				  ->whereNotExists(function($query) {
					  $query->select(DB::raw(1))
							->from('pending_domain_transfers')
							->whereColumn('pending_domain_transfers.domain_id', 'domains.id')
							->where('pending_domain_transfers.domain_type', 'DOMAIN')
							->where('pending_domain_transfers.status', 'pending');
				  });
			},
			'customDomain' => function($q) {
				$q->select(['id', 'user_id', 'domain', 'domainselected', 'hashtag', 'email'])
				  ->whereNotExists(function($query) {
					  $query->select(DB::raw(1))
							->from('pending_domain_transfers')
							->whereColumn('pending_domain_transfers.domain_id', 'customdomains.id')
							->where('pending_domain_transfers.domain_type', 'CUSTOM')
							->where('pending_domain_transfers.status', 'pending');
				  });
			},
			'handleDomain.user',
			'customDomain.user'
			])
			->where('price', '>', 0) // Add this line to exclude free listings
			->where(function($q) use ($query) {
			// Price filters
			if ($query['min_price']) {
				$q->where('price', '>=', $query['min_price']);
			}
			if ($query['max_price']) {
				$q->where('price', '<=', $query['max_price']);
			}
			})
            ->where(function($q) use ($query) {
                // Search filters
                if ($query['search']) {
                    $q->whereHas('handleDomain', function($q) use ($query) {
                        $q->where('domain', 'like', '%'.$query['search'].'%')
                          ->orWhere('domainselected', 'like', '%'.$query['search'].'%')
                          ->orWhere('hashtag', 'like', '%'.$query['search'].'%');
                    })
                    ->orWhereHas('customDomain', function($q) use ($query) {
                        $q->where('domain', 'like', '%'.$query['search'].'%')
                          ->orWhere('domainselected', 'like', '%'.$query['search'].'%')
                          ->orWhere('hashtag', 'like', '%'.$query['search'].'%');
                    });
                }
            })
            ->orderBy('created_at', 'desc');

        $sells = $sellsQuery->paginate(10);

        // Transform data for frontend
        $domains = [];
        foreach ($sells as $sell) {
            if ($sell->type === 'CUSTOM' && $sell->customDomain) {
                $domains[] = [
                    'id' => $sell->customDomain->id,
                    'domain' => $sell->customDomain->domain,
                    'domainselected' => $sell->customDomain->domainselected,
                    'hashtag' => $sell->customDomain->hashtag,
                    'email' => $sell->customDomain->email,
                    'type' => 'CUSTOM',
                    'sells' => [[
                        'price' => $sell->price,
                        'created_at' => $sell->created_at
                    ]],
                    'user' => $sell->customDomain->user
                        ? ['id' => $sell->customDomain->user->id, 'email' => $sell->customDomain->user->email]
                        : null
                ];
            } elseif ($sell->type === 'DOMAIN' && $sell->handleDomain) {
                $domains[] = [
                    'id' => $sell->handleDomain->id,
                    'domain' => $sell->handleDomain->domain,
                    'domainselected' => $sell->handleDomain->domainselected,
                    'hashtag' => $sell->handleDomain->hashtag,
                    'email' => $sell->handleDomain->email,
                    'type' => 'DOMAIN',
                    'sells' => [[
                        'price' => $sell->price,
                        'created_at' => $sell->created_at
                    ]],
                    'user' => $sell->handleDomain->user
                        ? ['id' => $sell->handleDomain->user->id, 'email' => $sell->handleDomain->user->email]
                        : null
                ];
            }
        }
	/*funnel data*/
    
	$fullDomain = request()->getHost();
	$servername = idn_to_utf8(substr(strstr($fullDomain, '.'), 1));
	$domain = Domain::whereRaw('BINARY `domain` = ?', [$funnelid])->where('domainselected', $servername)->first();
	if(empty($domain)) {
		$length = mb_strlen($funnelid, 'UTF-8');

		function detectChineseInString($string) {
			$chinesePattern = '/[\x{4E00}-\x{9FFF}\x{3400}-\x{4DBF}\x{F900}-\x{FAFF}]/u';
			return preg_match($chinesePattern, $string) ? 'chinese' : 'other';
		}

		// Check if it's a Chinese subdomain
		$isChineseSubdomain = detectChineseInString($funnelid);

		if ($isChineseSubdomain == 'chinese' && $length==1) {
			// URL encode the Chinese character for safe URL usage
			$encodedCharacter = urlencode($funnelid);
			$url = "https://hanziyuan.net/#" . $funnelid;
			// Redirect to the specified page with the Chinese character
			echo '<script type="text/javascript">
						window.open("' . addslashes($url) . '", "_blank", "width=800,height=600,resizable=yes,scrollbars=yes,location=yes");
					</script>';
			// Make sure to stop script execution after redirect
		}
		$fullDomain = request()->getHost();
		$servername = idn_to_utf8(substr(strstr($fullDomain, '.'), 1));
		$template = Frontpage::where('frontpages.id', 1)
			->join('templates', 'frontpages.theme_id', '=', 'templates.id')
			->select('templates.*')
			->first();
		
		$dayOfWeek = strtolower(Carbon::now()->format('D'));
		$domains = Admindomain::where('status', 'Active')
			->where(function ($query) use ($dayOfWeek) {
				$query->where('days', 'all')
					->orWhere('days', 'LIKE', "%$dayOfWeek%");
			})
			->orderBy('domain', 'ASC')
			->get(['domain']);
		
		$tokenInfo = TokenInfo::first();
		$promoprice = 0;
		$tooltips = Tooltip::all()->pluck('tooltips', 'reference');
		// Get promotion message with coupon relationship
		$promotionmessage='';
		if($length<4 )
		{
		$promotionmessage = Promotion::with('coupon')->where('id', 3)->first();
		}
		if($length>=4)
		{
		$promotionmessage = Promotion::with('coupon')->where('id', 4)->first();
		}
		
		// Extract coupon code if exists
		$defaultCouponCode = '';
		if ($promotionmessage && $promotionmessage->coupon) {
			$defaultCouponCode = $promotionmessage->coupon->coupon;
		}
		$codepage = Page::where('id',6)->value('code');
		return Inertia::render('offer500', [
			'template' => $template,
			'auth' => [
				'user' => auth()->user() ?? null
			],
			'tokenInfo' => $tokenInfo,
			'clean_domain' => $servername,
			'codepage' => $codepage,
			'domains' => $domains,
			'subdomain' => $funnelid,
			'promoprice' => $promoprice,
			'tooltips' => $tooltips,
			'promotionmessage' => $promotionmessage,
			'defaultCouponCode' => $defaultCouponCode, // Add this
			'checkDomainUrl' => url('/check-custom-domain'),
			'checkStandardDomainUrl' => url('/check-standard-domain')
		]);
	}
	if(!empty($domain))
	{
		$funnelData = EzFunnel::select('ez_funnels.*', 'ez_funnel_fields.*')
					->join('ez_funnel_fields', 'ez_funnels.id', '=', 'ez_funnel_fields.ez_funnel_id')
					->where('ez_funnels.id', $domain->funnelid)
					->orderBy('ez_funnel_fields.position')
					->get();
	$funnel = $funnelData->first();
	$hashtag = $domain->hashtag ?? '';
		if(!empty($funnel)){
		if($funnel->displaymode=='page')
		{
			$page = PageGenerate::where('id', $funnel->pageid)->firstOrFail();

            $restoredHtml = null;
            if (!empty($page->processed_html)) {
                $secretsJson = $page->getAttributes()['secrets'] ?? null;
                $restoredHtml = $this->htmlParser->renderPage($page->processed_html, $secretsJson);
            } elseif (!empty($page->html_content)) {
                $restoredHtml = $page->html_content;
            }
		$metaTitle = 'Ez way to WiKi and CoWiKi';
		$metaDescription = 'Ez.wiki';
		$metaKeywords = '';
		$metaSiteUrl = url()->current();
		$metaSiteName = 'ez.wiki';
		$metaLogo = 'https://ez.wiki/ezlogo.png';
		$favicon = 'https://ez.wiki/ezlogo.png';
		$qrcodelogo= 'https://ez.wiki/ezlogo.png';
		$effect = EffectSetting::where('ez_funnel_id', $funnel->ez_funnel_id)->get();
		if ($funnel) {
			$seoSettings = FunnelSeoSetting::where('funnel_id', $funnel->ez_funnel_id)->first();   
			if ($seoSettings) {
				$metaTitle = $seoSettings->meta_title ?? $metaTitle;
				$metaDescription = $seoSettings->meta_description ?? $metaDescription;
				$metaKeywords = $seoSettings->meta_keywords ?? $metaKeywords;
				$metaSiteUrl = $seoSettings->meta_site_url ?? $metaSiteUrl;
				$metaSiteName = $seoSettings->meta_site_name ?? $metaSiteName;
				$metaLogo = $seoSettings->meta_logo ?? $metaLogo;
			}
			
			$logoSettings = FunnelLogoSetting::where('funnel_id', $funnel->ez_funnel_id)->first();
			if ($logoSettings) {
				if ($logoSettings->favicon_logo == 1) {
					$favicon = 'https://ez.wiki/'.$logoSettings->logoimage ?? $favicon;
				}
				if ($logoSettings->meta_logo == 1) {
					$metaLogo = 'https://ez.wiki/'.$logoSettings->logoimage ?? $metaLogo;
				}
				if ($logoSettings->fly_sign_logo == 1 && $effect->isNotEmpty()) {
					$effect->first()->moving_effect = 'none';
					$effect->first()->avatar_link = 'https://ez.wiki/'.$logoSettings->logoimage;
				}
				$qrcodelogo= 'https://ez.wiki/'.$logoSettings->logoimage ?? $qrcodelogo;
			}
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
            ])->withViewData([
				'meta' => [
					'title' => $metaTitle,
					'description' => $metaDescription,
					'keywords' => $metaKeywords,
					'siteurl' => $metaSiteUrl,
					'sitename' => $metaSiteName,
					'metalogo' => $metaLogo
				],
				'favicon' => $favicon
			]);
		}
		if($funnel->displaymode=='ai')
		{
			$search = AISearchHistory::where('id', $funnel->aiid)->first();
			if (!$search) {
            if (request()->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'AI search not found',
                ], 404);
            }
            
            return redirect('/')->with('error', 'AI search not found');
        }
        
        // Get the first message to check conversation status
        $firstMessage = $search->getFirstMessage();
        $conversationStatus = $firstMessage ? $firstMessage->status : $search->status;
        
        // Check if guests can view this conversation
        $guestsAllowed = $this->canGuestsInteract($firstMessage);
        
        // Initialize variables with default values
        $guestInteractionDisabled = false;
        $requiresLogin = false;
        
        // Check if user has private access session (no expiry)
        $hasPrivateAccess = false;
        $sessionData = session('private_access_' . $firstMessage->conversation_id);
        if (!is_null($sessionData) && isset($sessionData['token'])) {
            $hasPrivateAccess = true;
        }
        
        // If conversation is private and user has private access session, allow viewing
        $isOwner = Auth::check() && $firstMessage && $firstMessage->user_id === Auth::id();
        $hasViewAccess = false;
        
        if ($conversationStatus === 'private') {
            if ($isOwner || $hasPrivateAccess) {
                $hasViewAccess = true;
                $requiresLogin = false;
                $guestInteractionDisabled = false;
            } else {
                $hasViewAccess = false;
                $requiresLogin = true;
                $guestInteractionDisabled = true;
            }
        } else {
            // For public conversations
            if ($firstMessage && $firstMessage->status === 'public' && !$guestsAllowed && !Auth::check()) {
                $guestInteractionDisabled = true;
                $requiresLogin = true;
                $hasViewAccess = false;
            } else {
                $hasViewAccess = true;
                $guestInteractionDisabled = false;
                $requiresLogin = false;
            }
        }
        
        // If user has access via private access, they can see all messages
        if ($hasPrivateAccess && $conversationStatus === 'private') {
            $guestInteractionDisabled = false;
            $requiresLogin = false;
        }
        
        AISearchHistory::ensureConversationPositions($search->conversation_id);
        // Get conversation messages with access filtering
        $conversationMessages = $this->getFilteredConversationMessages($search->conversation_id);
        
        // If user has private access, they should see all messages in the conversation
        if ($hasPrivateAccess && !$isOwner) {
            // Get all messages without filtering for private access users
            $conversationMessages = AISearchHistory::where('conversation_id', $search->conversation_id)->orderBy('position', 'asc')->orderBy('created_at', 'asc')
                ->get()
                ->filter(function ($message) use ($hasPrivateAccess, $isOwner) {
                    // For private access, show all non-hidden messages
                    if ($message->status === 'hidden' && !$isOwner) {
                        return false;
                    }
                    return true;
                })
                ->values();
        }
        
        // If it's an array, convert to Collection
        if (is_array($conversationMessages)) {
            $conversationMessages = collect($conversationMessages);
        }
        
        // Calculate conversation tokens and cost
        $conversationTokens = $conversationMessages->sum('total_tokens');
        $conversationCost = ($conversationTokens / 1000) * 0.01;
        
        // Get first message (for conversation context)
        $firstMessage = $search->getFirstMessage();
        
        // Get related searches (based on first message) - only public ones
        $relatedSearches = $firstMessage ? $firstMessage->getRelatedSearches(5) : collect();
        $relatedSearches = $relatedSearches->filter(function($related) {
            return $related->status === 'public';
        })->take(3);
        
        // Prepare the messages for response with IP address included
        $formattedMessages = $conversationMessages->map(function ($message) {
            return AISearchHistory::formatMessageForDisplay($message);
        });
        
        // Get all tooltips for AISearchView component
        $tooltips = AITooltip::where('component', 'AISearchView')
            ->orWhere('component', 'AI Search View')
            ->get()
            ->pluck('tooltips', 'reference')
            ->map(function($tooltip) {
                return is_array($tooltip) ? $tooltip[0] : (is_string($tooltip) ? json_decode($tooltip, true)[0] ?? $tooltip : $tooltip);
            })
            ->toArray();
        
        if (request()->expectsJson()) {
            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $search->id,
                    'slug' => $search->slug,
                    'conversation_id' => $search->conversation_id,
                    'thread_id' => $search->thread_id,
                    'conversation_title' => $search->conversation_title,
                    'message_role' => $search->message_role,
                    'content_type' => $search->content_type,
                    'query' => $search->query,
                    'response' => $search->response,
                    'sources' => $search->sources,
                    'usage' => $search->usage,
                    'thinking_enabled' => $search->thinking_enabled,
                    'model' => $search->model,
                    'temperature' => $search->temperature,
                    'max_tokens' => $search->max_tokens,
                    'finish_reason' => $search->finish_reason,
                    'created_at' => $search->created_at->toISOString(),
                    'created_at_formatted' => $search->created_at->format('M d, Y \a\t h:i A'),
                    'updated_at' => $search->updated_at->toISOString(),
                    'user' => $search->user ? [
                        'id' => $search->user->id,
                        'name' => $search->user->name,
                        'email' => $search->user->email,
                    ] : null,
                    'status' => $search->status,
					'landing_page_url' => $search->landing_page_url ?? null,
                    'share_url' => $search->getShareableUrl(),
                    'conversation_url' => $search->getConversationUrl(),
                    'total_tokens' => $search->total_tokens,
                    'conversation_tokens' => $conversationTokens,
                    'conversation_cost' => $conversationCost,
                ],
                'conversation_messages' => $formattedMessages,
                'message_count' => $conversationMessages->count(),
                'first_message' => $firstMessage ? [
                    'slug' => $firstMessage->slug,
                    'query' => $firstMessage->query,
                    'created_at' => $firstMessage->created_at->toISOString(),
                    'status' => $firstMessage->status,
                ] : null,
                'related' => $relatedSearches->map(function ($related) {
                    return [
                        'slug' => $related->slug,
                        'query' => $related->query,
                        'conversation_title' => $related->conversation_title,
                        'created_at' => $related->created_at->toISOString(),
                        'share_url' => $related->getShareableUrl(),
                        'message_count' => $related->message_count,
                        'status' => $related->status,
                    ];
                }),
                'guest_interaction_disabled' => $guestInteractionDisabled,
                'requires_login' => $requiresLogin,
                'has_private_access' => $hasPrivateAccess,
            ]);
        }
        
        $dayOfWeek = strtolower(Carbon::now()->format('D'));
        $domains = Admindomain::where('status', 'Active')
            ->where(function ($query) use ($dayOfWeek) {
                $query->where('days', 'all')
                    ->orWhere('days', 'LIKE', "%$dayOfWeek%");
            })
            ->orderBy('domain', 'ASC')
            ->get(['domain']);
        
        $tokenInfo = TokenInfo::first();
        $promoprice = 0;
        $effect = EffectSetting::where('ez_funnel_id', $funnel->ez_funnel_id)->get();
		$metaTitle = 'Ez way to WiKi and CoWiKi';
		$metaDescription = 'Ez.wiki';
		$metaKeywords = '';
		$metaSiteUrl = url()->current();
		$metaSiteName = 'ez.wiki';
		$metaLogo = 'https://ez.wiki/ezlogo.png';
		$favicon = 'https://ez.wiki/ezlogo.png';
		$qrcodelogo= 'https://ez.wiki/ezlogo.png';
		if ($funnel) {
			$seoSettings = FunnelSeoSetting::where('funnel_id', $funnel->ez_funnel_id)->first();   
			if ($seoSettings) {
				$metaTitle = $seoSettings->meta_title ?? $metaTitle;
				$metaDescription = $seoSettings->meta_description ?? $metaDescription;
				$metaKeywords = $seoSettings->meta_keywords ?? $metaKeywords;
				$metaSiteUrl = $seoSettings->meta_site_url ?? $metaSiteUrl;
				$metaSiteName = $seoSettings->meta_site_name ?? $metaSiteName;
				$metaLogo = $seoSettings->meta_logo ?? $metaLogo;
			}
			 
			$logoSettings = FunnelLogoSetting::where('funnel_id', $funnel->ez_funnel_id)->first();
			if ($logoSettings) {
				if ($logoSettings->favicon_logo == 1) {
					$favicon = 'https://ez.wiki/'.$logoSettings->logoimage ?? $favicon;
				}
				if ($logoSettings->meta_logo == 1) {
					$metaLogo = 'https://ez.wiki/'.$logoSettings->logoimage ?? $metaLogo;
				}
				if ($logoSettings->fly_sign_logo == 1 && $effect->isNotEmpty()) {
					$effect->first()->moving_effect = 'none';
					$effect->first()->avatar_link = 'https://ez.wiki/'.$logoSettings->logoimage;
				}
				$qrcodelogo= 'https://ez.wiki/'.$logoSettings->logoimage ?? $qrcodelogo;
			}
		}
        return Inertia::render('AISearchView', [
            'tokenInfo' => $tokenInfo,
            'domains' => $domains,
            'promoprice' => $promoprice,
            'tooltips' => $tooltips,
            'checkDomainUrl' => url('/check-custom-domain'),
            'checkStandardDomainUrl' => url('/check-ezpressstandard-domain'),
            'aiSettings' => $this->aiSettings,
            'search' => [
                'id' => $search->id,
                'slug' => $search->slug,
                'conversation_id' => $search->conversation_id,
                'thread_id' => $search->thread_id,
                'conversation_title' => $search->conversation_title,
                'message_role' => $search->message_role,
                'content_type' => $search->content_type,
                'query' => $search->query,
                'response' => $search->response,
                'sources' => $search->sources,
                'usage' => $search->usage,
                'thinking_enabled' => $search->thinking_enabled,
                'model' => $search->model,
                'temperature' => $search->temperature,
                'max_tokens' => $search->max_tokens,
                'finish_reason' => $search->finish_reason,
                'created_at' => $search->created_at->toISOString(),
                'created_at_formatted' => $search->created_at->format('M d, Y \a\t h:i A'),
                'updated_at' => $search->updated_at->toISOString(),
                'share_url' => $search->getShareableUrl(),
                'conversation_url' => $search->getConversationUrl(),
                'total_tokens' => $search->total_tokens,
                'conversation_tokens' => $conversationTokens,
                'conversation_cost' => $conversationCost,
                'status' => $search->status,
				'landing_page_url' => $search->landing_page_url ?? null,
                'user' => $search->user ? [
                    'id' => $search->user->id,
                    'name' => $search->user->name,
                    'email' => $search->user->email,
                ] : null,
            ],
            'conversation_messages' => $formattedMessages,
            'message_count' => $conversationMessages->count(),
            'share_url' => $search->getShareableUrl(),
            'related_searches' => $relatedSearches->map(function ($related) {
                return [
                    'slug' => $related->slug,
                    'query' => $related->query,
                    'conversation_title' => $related->conversation_title,
                    'created_at' => $related->created_at->toISOString(),
                    'share_url' => $related->getShareableUrl(),
                    'message_count' => $related->message_count,
                    'status' => $related->status,
                ];
            }),
            'guestInteractionDisabled' => $guestInteractionDisabled,
            'requiresLogin' => $requiresLogin,
            'hasPrivateAccess' => $hasPrivateAccess,
        ])->withViewData([
				'meta' => [
					'title' => $metaTitle,
					'description' => $metaDescription,
					'keywords' => $metaKeywords,
					'siteurl' => $metaSiteUrl,
					'sitename' => $metaSiteName,
					'metalogo' => $metaLogo
				],
				'favicon' => $favicon
			]);
		}
	}
	}else
	{
	$hashtag = $funnel->seo_tag ?? '';
	}
    $eyeTracking = $funnel ? $funnel->eye_tracking : 0;
	$visibility = $funnel ? $funnel->visibility : 0;
    $fly_sign = $funnel ? $funnel->fly_sign : 0;
    $mode = $funnel->mode ?? 'L';
	$designview = $funnel->designview ?? 'A';
	$color = $funnel->color ?? '#ffffff';
	$transparency = $funnel->transparency ?? '80';
	$token = $funnel->token;
	$displaymode = $funnel->displaymode;
    // Handle multiple themes
    $themeIds = $funnel ? array_map('trim', explode(',', $funnel->theme)) : [];
    // Get all templates in the same order as themeIds
    $templates = collect();
    foreach ($themeIds as $themeId) {
        $template = Template::where('id', $themeId)->first();
        if ($template) {
            $templates->push($template);
        }
    }

    // If no templates found, try to get single template
    if ($templates->isEmpty() && $funnel) {
        $template = Template::where('id', $funnel->theme)->first();
        if ($template) {
            $templates->push($template);
        }
    }
    $effect = EffectSetting::where('ez_funnel_id', $funnel->ez_funnel_id)->get();
	
    $agent = new Agent();
    $sidebarwidth = 1;
    
    $contents = $funnelData->map(function($item) use (&$sidebarwidth, $agent) {
            // Skip items marked with 🚀 or 0️⃣
            if ($item->emoji_marker === '🚀' || $item->emoji_marker === '0️⃣') {
                // If emoji is 🚀, open URL in new tab if it exists
                if ($item->emoji_marker === '🚀' && !empty($item->url)) {
                    echo "<script>window.open('{$item->url}', '_blank');</script>";
                }
                return null;
            }
            
            if ($item->emoji_marker === '🧨' && !empty($item->url)) {
				// Extract URLs from the string - supports:
				// 1. Full URLs (http/https)
				// 2. Plain domains (google.com)
				// 3. Ignores @@ and other markers
				preg_match_all('/(https?:\/\/[^\s,]+)|((?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2})?(?:\/[^\s,]*)?)/', $item->url, $matches);
				
				// Combine both match groups and filter out empty values
				$urls = array_filter(array_merge($matches[1], $matches[2]));
				
				// Clean up URLs (remove trailing punctuation)
				$urls = array_map(function($url) {
					$url = trim($url, " ,.@");
					// Add http:// if it's a plain domain
					if (!preg_match('/^https?:\/\//i', $url)) {
						$url = 'http://' . $url;
					}
					return $url;
				}, $urls);
				
				if (!empty($urls)) {
					foreach ($urls as $url) {
						echo "<script>window.open('{$url}', '_blank');</script>";
					}
				}
				return null;
			}
            
            // Determine width based on emoji_marker
            $width = '30'; // default for emojis like 🔐,3️⃣,🧨
            
            switch ($item->emoji_marker) {
                case '1️⃣':
                    $width = $item->custom_width-3;
                    break;
                case '2️⃣':
                    $width = '39';
                    break;
                case '3️⃣':
                    $width = '47';
                    break;
				case '4️⃣':
                    $width = '63';
                    break;
				case '5️⃣':
                    $width = '97';
                    break;
            }
            
            if ($agent->isMobile() || $agent->isTablet()) {
                $width = '90';
            }
            
            if($sidebarwidth == 1 && $width != 97) {
                $sidebarwidth = 93 - $width;
            }
            
            $userData = null;
            if ($item->user_id) {
                $user = User::find($item->user_id);
                if ($user) {
                    $userData = [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'profile_photo_url' => $user->profile_photo_url ?? null,
                        'is_verified' => $user->email_verified_at !== null,
                    ];
                }
            }
            return [
                'id' => $item->id,
                'title' => $item->caption ?? '',
                'url' => $item->url ? str_replace('{timeago}', $item->created_at ? $item->created_at->diffForHumans() : '', $item->url) : '',
				'image_url' => $item->image_url,
				'link_url' => $item->link_url,
                'width' => $width.'%',
				'emoji_marker' => $item->emoji_marker,
				'pinned' => $item->pinned,
				'reference' => $item->reference,
				'user' => $userData,
				'created_at' => $item->created_at ? $item->created_at->toISOString() : null,
                'post_type' => $item->post_type
            ];
        })->filter()->values()->all();
        
    $metaTitle = 'Ez way to WiKi and CoWiKi';
    $metaDescription = 'Ez.wiki';
    $metaKeywords = '';
    $metaSiteUrl = url()->current();
    $metaSiteName = 'ez.wiki';
    $metaLogo = 'https://ez.wiki/ezlogo.png';
    $favicon = 'https://ez.wiki/ezlogo.png';
	$qrcodelogo= 'https://ez.wiki/ezlogo.png';
    if ($funnel) {
        $seoSettings = FunnelSeoSetting::where('funnel_id', $funnel->ez_funnel_id)->first();   
        if ($seoSettings) {
            $metaTitle = $seoSettings->meta_title ?? $metaTitle;
            $metaDescription = $seoSettings->meta_description ?? $metaDescription;
            $metaKeywords = $seoSettings->meta_keywords ?? $metaKeywords;
            $metaSiteUrl = $seoSettings->meta_site_url ?? $metaSiteUrl;
            $metaSiteName = $seoSettings->meta_site_name ?? $metaSiteName;
            $metaLogo = $seoSettings->meta_logo ?? $metaLogo;
        }
         
        $logoSettings = FunnelLogoSetting::where('funnel_id', $funnel->ez_funnel_id)->first();
        if ($logoSettings) {
            if ($logoSettings->favicon_logo == 1) {
                $favicon = 'https://ez.wiki/'.$logoSettings->logoimage ?? $favicon;
            }
            if ($logoSettings->meta_logo == 1) {
                $metaLogo = 'https://ez.wiki/'.$logoSettings->logoimage ?? $metaLogo;
            }
            if ($logoSettings->fly_sign_logo == 1 && $effect->isNotEmpty()) {
                $effect->first()->moving_effect = 'none';
                $effect->first()->avatar_link = 'https://ez.wiki/'.$logoSettings->logoimage;
            }
			$qrcodelogo= 'https://ez.wiki/'.$logoSettings->logoimage ?? $qrcodelogo;
        }
    }
	$effect = $effect->isEmpty() ? null : $effect;
	$count = count($contents);
	$tooltips = Tooltip::all()->pluck('tooltips', 'reference');
    return Inertia::render('previewez', [
        'contents' => $contents ?? [],
        'template' => $templates->first(), // For backward compatibility
        'allTemplates' => $templates,      // Send all templates for slider
        'funnel' => $token,
		'hashtagseo' => $hashtag,
        'eye_tracking' => $eyeTracking,
		'visibility' => $visibility,
        'fly_sign' => $fly_sign,
		'displaymode' => $displaymode,
		'designview' => $designview,
        'mode' => $mode,
        'count' => $count,
		'color' => $color,
		'transparency' => $transparency,
        'sidebarwidth' => $sidebarwidth.'%',
        'effect' => $effect,
		'qrcodelogo' => $qrcodelogo,
		'domains' => $domains,
        'filters' => $query,
		'pagination' => [
                'current_page' => $sells->currentPage(),
                'last_page' => $sells->lastPage(),
                'per_page' => $sells->perPage(),
                'total' => $sells->total(),
            ],
		'tooltips' => $tooltips,
        'auth' => [
			'user' => auth()->user() ? [
				'id' => auth()->user()->id,
				'name' => auth()->user()->name,
				'email' => auth()->user()->email,
				'bee_points_balance' => auth()->user()->balance->bee_points_balance ?? 0,
			] : null
		]
    ])->withViewData([
        'meta' => [
            'title' => $metaTitle,
            'description' => $metaDescription,
            'keywords' => $metaKeywords,
            'siteurl' => $metaSiteUrl,
            'sitename' => $metaSiteName,
            'metalogo' => $metaLogo
        ],
        'favicon' => $favicon
    ]);
}

public function initiateHandlePayment(Request $request)
{
    $validated = $request->validate([
        'email' => 'required|email',
        'custom_handle' => 'required|string',
        'domain' => 'required|string',
        'price' => 'required|numeric|min:0',
        'promo_price' => 'required|numeric|min:0',
        'coupon_code' => 'nullable|string',
        'selling_price' => 'nullable|numeric|min:0',
        'payment_method' => 'required',
        'funnelId' => 'required|integer|exists:ez_funnels,id'
    ]);
	
    $user = Auth::user();
    $customHandle = strtolower(trim($validated['custom_handle']));
    $domain = $validated['domain'];
    $email = $validated['email'];
    $funnelId = $validated['funnelId'];
    $paymentMethod = $validated['payment_method'];
    
    // Check if handle is available
    $existingLink = Customdomain::whereRaw('BINARY `domain` = ?', [$customHandle])
        ->where('domainselected', $domain)
        ->where('user_id', '!=', $user->id)
        ->first();

    if ($existingLink) {
        return response()->json([
            'error' => 'This handle is already taken',
            'available' => false
        ], 409);
    }

   // Determine the actual price to use based on promo_price
        $actualPrice = $validated['promo_price'] > 0 ? $validated['promo_price'] : $validated['price'];
        $couponCode = $validated['coupon_code'] ?? null;
		if ($couponCode) {
				$coupon = Coupon::where('coupon', $couponCode)->first();
				
				if (!$coupon) {
					return response()->json([
						'error' => 'Invalid coupon code.'
					], 400);
				}
				
				if (!$coupon->isValidForUser($user->id)) {
					if ($coupon->status !== 'Active') {
						return response()->json([
							'error' => 'This coupon is not active.'
						], 400);
					}
					if ($coupon->limit_type === 'limited' && $coupon->getUsageCountAttribute() >= $coupon->use_limit) {
						return response()->json([
							'error' => 'This coupon has reached its usage limit.'
						], 400);
					}
				}
				
			}
		
    try {
        // Create payment intent
        $paymentIntent = PaymentIntent::create([
            'amount' => round($actualPrice * 100), // Convert to cents and round
            'currency' => 'usd',
            'metadata' => [
                'user_id' => $user->id,
                'domain' => $customHandle,
                'domainselected' => $domain,
                'funnel_id' => $funnelId,
                'email' => $email,
				'coupon_code' => $couponCode,
				'selling_price' => $validated['selling_price'],
				'payment_method' => $validated['payment_method'],
				'promo_price' => $validated['promo_price'],
            ],
            'receipt_email' => $email,
            'description' => "Purchase of custom handle {$domain}/{$customHandle}",
        ]);

        return response()->json([
            'clientSecret' => $paymentIntent->client_secret,
            'payment_intent_id' => $paymentIntent->id,
        ]);

    } catch (ApiErrorException $e) {
        Log::error('Stripe API Error: ' . $e->getMessage());
        return response()->json([
            'error' => 'Payment processing error. Please try again.'
        ], 500);
    } catch (\Exception $e) {
        Log::error('Handle Payment Error: ' . $e->getMessage());
        return response()->json([
            'error' => 'An unexpected error occurred.'
        ], 500);
    }
}

public function paymentsuccess(Request $request)
    {
        $request->validate([
            'payment_intent_id' => 'required|string',
        ]);

        $user = Auth::user();
        $paymentIntentId = $request->payment_intent_id;
		$coupon = null;
        try {
            // Retrieve payment intent from Stripe
            $paymentIntent = PaymentIntent::retrieve($paymentIntentId);

            if ($paymentIntent->status !== 'succeeded') {
                throw new \Exception('Payment not completed');
            }

            // Verify the payment belongs to the user
            if ($paymentIntent->metadata->user_id != $user->id) {
                throw new \Exception('Invalid payment');
            }
		if ($paymentIntent->metadata->coupon_code) {
				$coupon = Coupon::where('coupon', $paymentIntent->metadata->coupon_code)->first();
				
				if (!$coupon) {
					return response()->json([
						'error' => 'Invalid coupon code.'
					], 400);
				}
				
				if (!$coupon->isValidForUser($user->id)) {
					if ($coupon->status !== 'Active') {
						return response()->json([
							'error' => 'This coupon is not active.'
						], 400);
					}
					if ($coupon->limit_type === 'limited' && $coupon->getUsageCountAttribute() >= $coupon->use_limit) {
						return response()->json([
							'error' => 'This coupon has reached its usage limit.'
						], 400);
					}
				}
				
			}
            // Get the handle purchase record
			// Get the original funnel
        $funnel = EzFunnel::findOrFail($paymentIntent->metadata->funnel_id);

        // Create custom domain record
        $expiryDate = now()->addYear();
        
        $customDomain = Customdomain::create([
			'domain' => $paymentIntent->metadata->domain,
			'domainselected' => $paymentIntent->metadata->domainselected,
			'user_id' => $user->id,
			'funnelid' => $paymentIntent->metadata->funnel_id,
			'hashtag' => $funnel->seo_tag,
			'expire' => $expiryDate,
		]);

        // Create sales record if selling price provided
        if (!empty($validated['selling_price'])) {
            Sell::updateOrCreate(
                [
                    'sellid' => $customDomain->id,
                    'type' => 'CUSTOM',
                    'user_id' => $user->id
                ],
                [
                    'uniquesellid' => time(),
                    'price' => $paymentIntent->metadata->selling_price,
                    'expire' => $expiryDate
                ]
            );
        }
        
        // Record the purchase
        $handlePurchase = HandlePurchase::create([
            'user_id' => $user->id,
            'customdomain_id' => $customDomain->id,
            'amount' => $paymentIntent->amount / 100,
            'currency' => 'USD',
            'bee_points_amount' => null,
            'payment_method' => 'stripe',
            'coupon_code' => $paymentIntent->metadata->coupon_code,
            'discount_amount' => $paymentIntent->metadata->promo_price,
            'status' => 'completed',
            'transaction_id' => 'HNDL-' . strtoupper(Str::random(8))
        ]);
          if ($coupon) {
				  CouponUsage::create([
                    'coupon_id' => $coupon->id,
                    'user_id' => $user->id,
                    'coupon_code' => $coupon->coupon,
                    'used_at' => now(),
                ]);
			}  
            // Create stripe transaction record
            $stripeTransaction = StripeTransaction::create([
                'stripe_payment_id' => $paymentIntent->id,
                'user_id' => $user->id,
                'handle_purchase_id' => $handlePurchase->id,
                'amount' => $paymentIntent->amount / 100, // Convert back to dollars
                'currency' => $paymentIntent->currency,
                'status' => $paymentIntent->status,
                'payment_method_details' => $paymentIntent->payment_method ? 
                    PaymentMethod::retrieve($paymentIntent->payment_method)->toArray() : null,
                'customer_details' => [
                    'email' => $paymentIntent->receipt_email,
                ],
            ]);
			$customHandle=$paymentIntent->metadata->domain;
			$domain=$paymentIntent->metadata->domainselected;
            // Create invoice
			 $invoice = $handlePurchase->invoice()->create([
				'invoice_number' => 'INV-HNDL-' . strtoupper(Str::random(8)),
				'user_id' => $user->id,
				'stripe_transaction_id' => $stripeTransaction->id,
				'handle_purchase_id' => $handlePurchase->id,
				'issue_date' => now(),
				'due_date' => now()->addDays(30),
				'amount' => $paymentIntent->amount / 100,
				'status' => 'paid',
				'items' => [
					[
						'description' => "Custom Handle Purchase: {$domain}/{$customHandle}",
						'quantity' => 1,
						'unit_price' => $paymentIntent->amount / 100,
						'amount' => $paymentIntent->amount / 100,
					]
				],
				'notes' => 'Thank you for your purchase!',
			]);
			$fullDomain='https://'.$domain.'/'.$customHandle;
			$emaildesign = Emaildesign::where('id', 22)->first();
            $str = ['{fullDomain}', '{amount}', '{invoiceNumber}', '{purchaseDate}', '{payment}'];
            $rplc = [$fullDomain, $paymentIntent->amount / 100, $invoice->invoice_number, now(), 'US$'];
            $div = str_replace($str, $rplc, $emaildesign['design']);
            $mailData = ['design' => $div];
            
            try {
                $subject = "Ez.wiki Congratulations on your new Custom Domain.";
                Mail::to(strtolower($user->email))->send(new Eznew($mailData, $subject));
				Mail::getSymfonyTransport()->stop();
            } catch (\Exception $e) {
                $subject = "Ez.wiki Congratulations on your new Custom Domain.";
                @mail($user->email, $subject, $div, null, 'funnel@ez.wiki');
            }
            return response()->json([
				'success' => true,
				'url' => "https://{$domain}/{$customHandle}",
				'html' => '<a href="https://'.$domain.'/'.$customHandle.'" target="_blank" class="btn btn-warning reloadcreatenew">https://'.$domain.'/'.$customHandle.'</a>',
				'available' => true
			]);
        } catch (ApiErrorException $e) {
            return response()->json([
                'error' => 'Payment verification failed. Please contact support.'
            ], 500);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage()
            ], 500);
        }
    }
	
public function initiateDomainPayment(Request $request)
{
    $validated = $request->validate([
        'email' => 'required|email',
        'custom_handle' => 'required|string',
        'domain' => 'required|string',
        'price' => 'required|numeric|min:0',
        'promo_price' => 'required|numeric|min:0',
        'coupon_code' => 'nullable|string',
        'selling_price' => 'nullable|numeric|min:0',
        'payment_method' => 'required',
        'funnelId' => 'required|integer|exists:ez_funnels,id'
    ]);
	
    $user = Auth::user();
    $customHandle = strtolower(trim($validated['custom_handle']));
    $domain = $validated['domain'];
    $email = $validated['email'];
    $funnelId = $validated['funnelId'];
    $paymentMethod = $validated['payment_method'];
    
    // Check if handle is available
    $existingLink = Domain::whereRaw('BINARY `domain` = ?', [$customHandle])
        ->where('domainselected', $domain)
        ->where('user_id', '!=', $user->id)
        ->first();

    if ($existingLink) {
        return response()->json([
            'error' => 'This handle is already taken',
            'available' => false
        ], 409);
    }

   // Determine the actual price to use based on promo_price
        $actualPrice = $validated['promo_price'] > 0 ? $validated['promo_price'] : $validated['price'];
        $couponCode = $validated['coupon_code'] ?? null;
		if ($couponCode) {
				$coupon = Coupon::where('coupon', $couponCode)->first();
				
				if (!$coupon) {
					return response()->json([
						'error' => 'Invalid coupon code.'
					], 400);
				}
				
				if (!$coupon->isValidForUser($user->id)) {
					if ($coupon->status !== 'Active') {
						return response()->json([
							'error' => 'This coupon is not active.'
						], 400);
					}
					if ($coupon->limit_type === 'limited' && $coupon->getUsageCountAttribute() >= $coupon->use_limit) {
						return response()->json([
							'error' => 'This coupon has reached its usage limit.'
						], 400);
					}
				}
				
			}

    try {
        // Create payment intent
        $paymentIntent = PaymentIntent::create([
            'amount' => round($actualPrice * 100), // Convert to cents and round
            'currency' => 'usd',
            'metadata' => [
                'user_id' => $user->id,
                'domain' => $customHandle,
                'domainselected' => $domain,
                'funnel_id' => $funnelId,
                'email' => $email,
				'coupon_code' => $validated['coupon_code'],
				'selling_price' => $validated['selling_price'],
				'payment_method' => $validated['payment_method'],
				'promo_price' => $validated['promo_price'],
            ],
            'receipt_email' => $email,
            'description' => "Purchase of Domain handle {$customHandle}.{$domain}",
        ]);

        return response()->json([
            'clientSecret' => $paymentIntent->client_secret,
            'payment_intent_id' => $paymentIntent->id,
        ]);

    } catch (ApiErrorException $e) {
        Log::error('Stripe API Error: ' . $e->getMessage());
        return response()->json([
            'error' => 'Payment processing error. Please try again.'
        ], 500);
    } catch (\Exception $e) {
        Log::error('Handle Payment Error: ' . $e->getMessage());
        return response()->json([
            'error' => 'An unexpected error occurred.'
        ], 500);
    }
}

	public function domainpaymentsuccess(Request $request)
    {
        $request->validate([
            'payment_intent_id' => 'required|string',
        ]);

        $user = Auth::user();
        $paymentIntentId = $request->payment_intent_id;
		$coupon = null;
        try {
            // Retrieve payment intent from Stripe
            $paymentIntent = PaymentIntent::retrieve($paymentIntentId);

            if ($paymentIntent->status !== 'succeeded') {
                throw new \Exception('Payment not completed');
            }

            // Verify the payment belongs to the user
            if ($paymentIntent->metadata->user_id != $user->id) {
                throw new \Exception('Invalid payment');
            }
		if ($paymentIntent->metadata->coupon_code) {
				$coupon = Coupon::where('coupon', $paymentIntent->metadata->coupon_code)->first();
				
				if (!$coupon) {
					return response()->json([
						'error' => 'Invalid coupon code.'
					], 400);
				}
				
				if (!$coupon->isValidForUser($user->id)) {
					if ($coupon->status !== 'Active') {
						return response()->json([
							'error' => 'This coupon is not active.'
						], 400);
					}
					if ($coupon->limit_type === 'limited' && $coupon->getUsageCountAttribute() >= $coupon->use_limit) {
						return response()->json([
							'error' => 'This coupon has reached its usage limit.'
						], 400);
					}
				}
				
			}
            // Get the handle purchase record
			// Get the original funnel
        $funnel = EzFunnel::findOrFail($paymentIntent->metadata->funnel_id);

        // Create custom domain record
        $expiryDate = now()->addYear();
        
        $customDomain = Domain::create([
			'domain' => $paymentIntent->metadata->domain,
			'domainselected' => $paymentIntent->metadata->domainselected,
			'user_id' => $user->id,
			'funnelid' => $paymentIntent->metadata->funnel_id,
			'hashtag' => $funnel->seo_tag,
			'expire' => $expiryDate,
		]);

        // Create sales record if selling price provided
        if (!empty($validated['selling_price'])) {
            Sell::updateOrCreate(
                [
                    'sellid' => $customDomain->id,
                    'type' => 'DOMAIN',
                    'user_id' => $user->id
                ],
                [
                    'uniquesellid' => time(),
                    'price' => $paymentIntent->metadata->selling_price,
                    'expire' => $expiryDate
                ]
            );
        }
        
        // Record the purchase
        $handlePurchase = HandlePurchase::create([
            'user_id' => $user->id,
            'domain_id' => $customDomain->id,
            'amount' => $paymentIntent->amount / 100,
            'currency' => 'USD',
            'bee_points_amount' => null,
            'payment_method' => 'stripe',
            'coupon_code' => $paymentIntent->metadata->coupon_code,
            'discount_amount' => $paymentIntent->metadata->promo_price,
            'status' => 'completed',
            'transaction_id' => 'HNDL-' . strtoupper(Str::random(8))
        ]);
         if ($coupon) {
				  CouponUsage::create([
                    'coupon_id' => $coupon->id,
                    'user_id' => $user->id,
                    'coupon_code' => $coupon->coupon,
                    'used_at' => now(),
                ]);
			}   
            // Create stripe transaction record
            $stripeTransaction = StripeTransaction::create([
                'stripe_payment_id' => $paymentIntent->id,
                'user_id' => $user->id,
                'handle_purchase_id' => $handlePurchase->id,
                'amount' => $paymentIntent->amount / 100, // Convert back to dollars
                'currency' => $paymentIntent->currency,
                'status' => $paymentIntent->status,
                'payment_method_details' => $paymentIntent->payment_method ? 
                    PaymentMethod::retrieve($paymentIntent->payment_method)->toArray() : null,
                'customer_details' => [
                    'email' => $paymentIntent->receipt_email,
                ],
            ]);
			$customHandle=$paymentIntent->metadata->domain;
			$domain=$paymentIntent->metadata->domainselected;
            // Create invoice
			 $invoice = $handlePurchase->invoice()->create([
				'invoice_number' => 'INV-HNDL-' . strtoupper(Str::random(8)),
				'user_id' => $user->id,
				'stripe_transaction_id' => $stripeTransaction->id,
				'handle_purchase_id' => $handlePurchase->id,
				'issue_date' => now(),
				'due_date' => now()->addDays(30),
				'amount' => $paymentIntent->amount / 100,
				'status' => 'paid',
				'items' => [
					[
						'description' => "Custom Handle Purchase: {$customHandle}.{$domain}",
						'quantity' => 1,
						'unit_price' => $paymentIntent->amount / 100,
						'amount' => $paymentIntent->amount / 100,
					]
				],
				'notes' => 'Thank you for your purchase!',
			]);
			$fullDomain='https://'.$customHandle.'.'.$domain;
			$emaildesign = Emaildesign::where('id', 23)->first();
            $str = ['{fullDomain}', '{amount}', '{invoiceNumber}', '{purchaseDate}', '{payment}'];
            $rplc = [$fullDomain, $paymentIntent->amount / 100, $invoice->invoice_number, now(), 'US$'];
            $div = str_replace($str, $rplc, $emaildesign['design']);
            $mailData = ['design' => $div];
            
            try {
                $subject = "Ez.wiki Congratulations on your new Domain.";
                Mail::to(strtolower($user->email))->send(new Eznew($mailData, $subject));
				Mail::getSymfonyTransport()->stop();
            } catch (\Exception $e) {
                $subject = "Ez.wiki Congratulations on your new Domain.";
                @mail($user->email, $subject, $div, null, 'funnel@ez.wiki');
            }
            return response()->json([
				'success' => true,
				'url' => "https://{$customHandle}.{$domain}",
				'html' => '<a href="https://'.$customHandle.'.'.$domain.'" target="_blank" class="btn btn-warning reloadcreatenew">https://'.$customHandle.'.'.$domain.'</a>',
				'available' => true
			]);
        } catch (ApiErrorException $e) {
            return response()->json([
                'error' => 'Payment verification failed. Please contact support.'
            ], 500);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage()
            ], 500);
        }
    }
	
	public function handlepurchasehistory(Request $request) 
{
    $user = Auth::user();

    $purchasesQuery = HandlePurchase::where('user_id', $user->id)
        ->where('status', 'completed')
        ->orderBy('created_at', 'desc')
        ->with([
            'invoice:id,handle_purchase_id,invoice_number,issue_date,amount',
            'Customdomain:id,domain,domainselected',
            'domain:id,domain,domainselected'
        ]);

    $paginatedPurchases = $purchasesQuery->paginate(10)->through(function ($purchase) {
        $domain = $purchase->customDomain ?? $purchase->domain;
        $type = $purchase->customDomain ? 'custom' : ($purchase->domain ? 'standard' : 'unknown');
        
        return [
            'id' => $purchase->id,
            'bee_points_amount' => $purchase->bee_points_amount,
            'amount' => $purchase->amount,
            'currency' => $purchase->currency,
            'payment_method' => $purchase->payment_method,
            'status' => $purchase->status,
            'processed_at' => Carbon::parse($purchase->created_at)->format('Y-m-d H:i:s'),
            'transaction_id' => $purchase->transaction_id,
            'invoice' => $purchase->invoice ? [
                'number' => $purchase->invoice->invoice_number,
                'date' => Carbon::parse($purchase->invoice->issue_date)->format('Y-m-d'),
                'amount' => $purchase->invoice->amount
            ] : null,
            'domain' => $domain ? [
                'name' => $domain->domain,
                'selected' => $domain->domainselected,
                'type' => $type,
                'url' => $type === 'custom'
                    ? "https://{$domain->domainselected}/{$domain->domain}"
                    : "https://{$domain->domain}.{$domain->domainselected}"
            ] : null
        ];
    });
	
    // 2. Check if the request is an AJAX request
    if ($request->wantsJson()) {
        return response()->json($paginatedPurchases);
    }

    // 3. For initial load, render the full page with Inertia
    $template = Frontpage::where('frontpages.id', 1)
        ->join('templates', 'frontpages.theme_id', '=', 'templates.id')
        ->select('templates.*')
        ->first();

    return Inertia::render('handlepurchasehistory', [
        'template' => $template,
        'auth' => [
            'user' => $user ?? null
        ],
        'purchases' => $paginatedPurchases
    ]);
}

public function showHandleInvoice($invoiceNumber)
{
    $user = Auth::user();
    $template = Frontpage::where('frontpages.id', 1)
        ->join('templates', 'frontpages.theme_id', '=', 'templates.id')
        ->select('templates.*')
        ->first();

    $invoice = Invoice::where('invoice_number', $invoiceNumber)
        ->with(['handlePurchase.customDomain', 'handlePurchase.domain', 'stripeTransaction'])
        ->firstOrFail();
    
    // Verify the invoice belongs to the user
    if ($invoice->user_id !== $user->id) {
        abort(403);
    }

    // Get handle details
    $handle = null;
    if ($invoice->handlePurchase) {
        if ($invoice->handlePurchase->customDomain) {
            $handle = [
                'type' => 'custom',
                'name' => $invoice->handlePurchase->customDomain->domain,
                'domain' => $invoice->handlePurchase->customDomain->domainselected,
                'url' => "https://{$invoice->handlePurchase->customDomain->domainselected}/{$invoice->handlePurchase->customDomain->domain}"
            ];
        } elseif ($invoice->handlePurchase->domain) {
            $handle = [
                'type' => 'standard',
                'name' => $invoice->handlePurchase->domain->domain,
                'domain' => $invoice->handlePurchase->domain->domainselected,
                'url' => "https://{$invoice->handlePurchase->domain->domain}.{$invoice->handlePurchase->domain->domainselected}"
            ];
        }
    }

    // Prepare transaction details
    $transaction = [
        'id' => null,
        'amount' => $invoice->amount,
        'currency' => 'USD',
        'status' => $invoice->status,
        'payment_method' => 'N/A',
        'last4' => '****'
    ];

    if ($invoice->stripeTransaction) {
        $transaction = [
            'id' => $invoice->stripeTransaction->stripe_payment_id,
            'amount' => number_format($invoice->stripeTransaction->amount, 2),
            'currency' => strtoupper($invoice->stripeTransaction->currency),
            'status' => $invoice->stripeTransaction->status,
            'payment_method' => $invoice->stripeTransaction->payment_method_details['card']['brand'] ?? 'N/A',
            'last4' => $invoice->stripeTransaction->payment_method_details['card']['last4'] ?? '****',
        ];
    } elseif ($invoice->handlePurchase && $invoice->handlePurchase->payment_method === 'bee') {
        $transaction = [
            'id' => $invoice->handlePurchase->transaction_id,
            'amount' => number_format($invoice->handlePurchase->amount, 2),
            'currency' => $invoice->handlePurchase->currency,
            'status' => $invoice->handlePurchase->status,
            'payment_method' => 'Bee Points',
            'last4' => 'EZ$'
        ];
    }
	
    return Inertia::render('handleinvoice', [
        'template' => $template,
        'auth' => [
            'user' => $user ?? null
        ],
        'invoice' => [
            'invoice_number' => $invoice->invoice_number,
            'issue_date' => Carbon::parse($invoice->issue_date)->format('M d, Y'),
            'due_date' => Carbon::parse($invoice->due_date)->format('M d, Y'),
            'status' => $invoice->status,
            'amount' => number_format($invoice->amount, 2),
            'items' => $invoice->items,
            'notes' => $invoice->notes,
            'transaction' => $transaction,
            'handle' => $handle
        ]
    ]);
}

public function tokenTransactions(Request $request)
{
    $template = Frontpage::where('frontpages.id', 1)
        ->join('templates', 'frontpages.theme_id', '=', 'templates.id')
        ->select('templates.*')
        ->first();
    
    $user = Auth::user();
    $totalBalance = TokenTransaction::where('user_id', $user->id)->sum('amount');
    $positiveBalance = TokenTransaction::where('user_id', $user->id)->clone()->where('amount', '>', 0)->sum('amount');
    $negativeBalance = abs(TokenTransaction::where('user_id', $user->id)->clone()->where('amount', '<', 0)->sum('amount'));
    $transactions = TokenTransaction::where('user_id', $user->id)
        ->orderBy('created_at', 'desc')
        ->paginate(10)
        ->through(function ($transaction) {
            return [
                'id' => $transaction->id,
                'amount' => $transaction->amount,
                'transaction_type' => $transaction->transaction_type,
                'reference_id' => $transaction->reference_id,
                'custom_id' => $transaction->custom_id,
                'domain_id' => $transaction->domain_id,
                'balance_before' => $transaction->balance_before,
                'balance_after' => $transaction->balance_after,
                'created_at' => $transaction->created_at->format('M d, Y H:i:s'),
            ];
        });
	
	if ($request->wantsJson()) {
        return response()->json($transactions);
    }
	
    return Inertia::render('tokentransactions', [
        'template' => $template,
        'auth' => [
            'user' => $user ?? null
        ],
		'totals' => [
                'total' => $totalBalance,
                'positive' => $positiveBalance,
                'negative' => $negativeBalance
        ],
        'transactions' => $transactions
    ]);
}

public function demodesign()
{
    $template = Frontpage::where('frontpages.id', 1)
        ->join('templates', 'frontpages.theme_id', '=', 'templates.id')
        ->select('templates.*')
        ->first();
    
    $dayOfWeek = strtolower(Carbon::now()->format('D'));
    $domains = Admindomain::where('status', 'Active')
        ->where(function ($query) use ($dayOfWeek) {
            $query->where('days', 'all')
                ->orWhere('days', 'LIKE', "%$dayOfWeek%");
        })
        ->orderBy('domain', 'ASC')
        ->get(['domain']);
    
    $tokenInfo = TokenInfo::first();
    $promoprice = 0;
    
    return Inertia::render('home', [
        'template' => $template,
        'auth' => [
            'user' => auth()->user() ?? null
        ],
        'tokenInfo' => $tokenInfo,
        'domains' => $domains,
        'promoprice' => $promoprice,
        'checkDomainUrl' => url('/check-custom-domain'),
        'checkStandardDomainUrl' => url('/check-standard-domain')
    ]);
}

public function checkCustomDomainAvailability(Request $request)
{
     $request->validate([
            'handle' => 'required|string',
            'domain' => 'required|string',
        ]);

        $handle = strtolower(trim($request->input('handle')));
        $domain = $request->input('domain');

        // Check if custom domain handle is available
        $customDomainExists = Customdomain::whereRaw('BINARY `domain` = ?', [$handle])
            ->where('domainselected', $domain)
            ->exists();

        // Check if funnel token exists
        $funnelExists = EzFunnel::where('token', $handle)->exists();
        
        // Check if reserved
        $reserved = Reserve::where('reserve', $handle)->exists();

        $available = !$customDomainExists && !$funnelExists && !$reserved;
        
        $charCount = iconv_strlen(str_replace(' ', '', urldecode($handle)),'UTF-8');
        
        // Calculate price based on character count
        $priceString = Powerstring::where('min_word', '<=', $charCount)
            ->where('max_word', '>=', $charCount)
            ->first();

        $price = $priceString ? $priceString->custom_price : 0;
        $promoPrice = 0; // Pre-launch promotion price

        return response()->json([
            'available' => $available,
            'message' => $available ? 'Domain is available' : 'Domain is not available',
            'charCount' => $charCount,
            'price' => $price,
            'promoPrice' => $promoPrice,
            'handle' => $handle,
            'domain' => $domain
        ]);
}

public function checkStandardDomainAvailability(Request $request)
{
    $request->validate([
            'handle' => 'required|string',
            'domain' => 'required|string',
        ]);

        $handle = strtolower(trim($request->input('handle')));
        $domain = $request->input('domain');

        // Check if standard domain is available (handle.domain format)
        $domainExists = Domain::whereRaw('BINARY `domain` = ?', [$handle])
            ->where('domainselected', $domain)
            ->exists();
       
        // Check if reserved
        $reserved = Reserve::where('reserve', $handle)->exists();

        $available = !$domainExists && !$reserved;
        
        $charCount = iconv_strlen(str_replace(' ', '', urldecode($handle)),'UTF-8');
        
        // Calculate price based on character count
        $priceString = Powerstring::where('min_word', '<=', $charCount)
            ->where('max_word', '>=', $charCount)
            ->first();

        $price = $priceString ? $priceString->dollar_price : 0;
        $promoPrice = 0; // Pre-launch promotion price

        return response()->json([
            'available' => $available,
            'message' => $available ? 'Domain is available' : 'Domain is not available',
            'charCount' => $charCount,
            'price' => $price,
            'promoPrice' => $promoPrice,
            'handle' => $handle,
            'domain' => $domain
        ]);
}

public function privacypolicy()
{
    $template = Frontpage::where('frontpages.id', 1)
        ->join('templates', 'frontpages.theme_id', '=', 'templates.id')
        ->select('templates.*')
        ->first();
    
    return Inertia::render('privacypolicy', [
        'template' => $template,
        'auth' => [
            'user' => auth()->user() ?? null
        ]
    ]);
}

public function termsandconditions()
{
    $template = Frontpage::where('frontpages.id', 1)
        ->join('templates', 'frontpages.theme_id', '=', 'templates.id')
        ->select('templates.*')
        ->first();
    
    return Inertia::render('termsandconditions', [
        'template' => $template,
        'auth' => [
            'user' => auth()->user() ?? null
        ]
    ]);
}

	public function purchaseTheme(Request $request)
    {
        $request->validate([
            'theme_id' => 'required|exists:templates,id',
            'price' => 'required|numeric|min:0'
        ]);

        $user = auth()->user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not authenticated'
            ], 401);
        }

        // Start database transaction
        DB::beginTransaction();

        try {
            // Lock the user's balance for update to prevent race conditions
            $balance = UserBalance::where('user_id', $user->id)->lockForUpdate()->first();

            if (!$balance) {
                // Create balance record if doesn't exist
                $balance = UserBalance::create([
                    'user_id' => $user->id,
                    'bee_points_balance' => 0,
                    'balance' => 0
                ]);
            }

            $theme = Template::lockForUpdate()->find($request->theme_id);
            if (!$theme) {
                throw new \Exception('Theme not found');
            }

            // Check if user already owns the theme
            $existingCollection = Themecollection::where('user_id', $user->id)
                ->where('theme_id', $theme->id)
                ->first();

            if ($existingCollection) {
                throw new \Exception('You already own this theme');
            }

            // Check if theme is free (price = 0)
            if ($theme->price <= 0) {
                // Add free theme to collection
                Themecollection::create([
                    'user_id' => $user->id,
                    'theme_id' => $theme->id
                ]);

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'Free theme added to your collection successfully'
                ]);
            }

            // For paid themes, check balance
            if ($balance->bee_points_balance < $request->price) {
                throw new \Exception('Insufficient EZ$ balance');
            }

            // Get the theme owner (seller)
            $sellerId = $theme->user_id;
            if ($sellerId === $user->id) {
                throw new \Exception('Cannot purchase your own theme');
            }

            // Calculate commission (10%) and seller amount (90%)
            $commission = $request->price * 0.10;
            $sellerAmount = $request->price * 0.90;

            // Deduct full amount from buyer
            $balanceBefore = $balance->bee_points_balance;
            $balance->bee_points_balance -= $request->price;
            $balance->save();

            // Record transaction for buyer
            TokenTransaction::create([
                'user_id' => $user->id,
                'amount' => -$request->price,
                'transaction_type' => 'theme_purchase',
                'description' => 'Purchased theme: ' . $theme->title . ' (ID: ' . $theme->id . ')',
                'balance_before' => $balanceBefore,
                'balance_after' => $balance->bee_points_balance,
                'custom_id' => $theme->id,
            ]);

            // Transfer 90% to theme owner (seller) - only if not system theme (user_id != 0)
            if ($sellerId > 0) {
                $sellerBalance = UserBalance::where('user_id', $sellerId)->lockForUpdate()->first();
                
                if (!$sellerBalance) {
                    // Create balance record for seller if doesn't exist
                    $sellerBalance = UserBalance::create([
                        'user_id' => $sellerId,
                        'bee_points_balance' => 0,
                        'balance' => 0
                    ]);
                }

                $sellerBalanceBefore = $sellerBalance->bee_points_balance;
                $sellerBalance->bee_points_balance += $sellerAmount;
                $sellerBalance->save();

                // Record transaction for seller
                TokenTransaction::create([
                    'user_id' => $sellerId,
                    'amount' => $sellerAmount,
                    'transaction_type' => 'theme_sale',
                    'description' => 'Sold theme: ' . $theme->title . ' to user ' . $user->id,
                    'balance_before' => $sellerBalanceBefore,
                    'balance_after' => $sellerBalance->bee_points_balance,
                    'custom_id' => $theme->id,
                ]);
            }

            // Transfer 10% commission to admin reserve (for both user themes and system themes)
            $tokenInfo = TokenInfo::first();
            if ($tokenInfo) {
                $reserveBefore = $tokenInfo->reserved_supply;
                $tokenInfo->reserved_supply += $commission;
                $tokenInfo->last_updated = now();
                $tokenInfo->save();

                // Record reserve transaction
                $reserveTransaction = ReserveTransaction::create([
                    'transaction_type' => 'reserve',
                    'amount' => $commission,
                    'reason' => 'Theme sale commission - Theme: ' . $theme->title . ' (ID: ' . $theme->id . ')',
                    'reference_id' => 'RES-' . Str::upper(Str::random(8)),
                    'user_id' => $user->id,
                    'admin_id' => 2 // Assuming admin user ID is 1
                ]);

                // Generate invoice for commission if service exists
                if (class_exists(InvoiceService::class)) {
                    try {
                        InvoiceService::createForReserveTransaction($reserveTransaction);
                    } catch (\Exception $e) {
                        // Log but don't fail the transaction if invoice creation fails
                        \Log::error('Failed to create reserve invoice: ' . $e->getMessage());
                    }
                }
            }

            // Create theme purchase record
            $purchase = ThemePurchase::create([
                'user_id' => $user->id,
                'theme_id' => $theme->id,
                'amount' => $request->price,
                'currency' => 'BEE',
                'payment_method' => 'bee_points',
                'status' => 'completed',
                'transaction_id' => 'THM-' . strtoupper(Str::random(8)),
                'seller_id' => $sellerId > 0 ? $sellerId : null,
                'seller_amount' => $sellerAmount,
                'commission' => $commission
            ]);

            // Create invoice for the theme purchase
            $invoice = $purchase->invoice()->create([
                'invoice_number' => 'INV-THEME-' . strtoupper(Str::random(8)),
                'user_id' => $user->id,
                'theme_purchase_id' => $purchase->id,
                'issue_date' => now(),
                'due_date' => now()->addDays(30),
                'amount' => $request->price,
                'status' => 'paid',
                'items' => [
                    [
                        'description' => "Theme Purchase: {$theme->title} (ID: {$theme->id})",
                        'quantity' => 1,
                        'unit_price' => $request->price,
                        'amount' => $request->price,
                    ]
                ],
                'notes' => $sellerId > 0 
                    ? 'Thank you for your theme purchase! 90% has been sent to the theme creator.' 
                    : 'Thank you for your theme purchase! This is a system theme.',
            ]);

            // Add to theme collection
            Themecollection::create([
                'user_id' => $user->id,
                'theme_id' => $theme->id
            ]);

            // Send email notification if email design exists
            $emaildesign = Emaildesign::where('id', 32)->first();
            if ($emaildesign) {
                $str = ['{themeid}', '{amount}', '{status}', '{confirmationdate}'];
                $rplc = [
                    $theme->unique_id, 
                    number_format($request->price, 2), 
                    'Theme Purchase Completed', 
                    now()->format('M d, Y H:i:s')
                ];
                $div = str_replace($str, $rplc, $emaildesign['design']);
                $mailData = ['design' => $div];

                try {
                    $subject = "Ez.wiki Your Theme Purchase is Complete";
                    Mail::to(strtolower($user->email))->send(new Eznew($mailData, $subject));
                    Mail::getSymfonyTransport()->stop();
                } catch (\Exception $e) {
                    $subject = "Ez.wiki Your Theme Purchase is Complete";
                    @mail($user->email, $subject, $div, null, 'funnel@ez.wiki');
                }
            }

            // Commit all changes
            DB::commit();

            return response()->json([
                'success' => true,
                'balance' => $balance->bee_points_balance,
                'purchase_id' => $purchase->id,
                'invoice_id' => $invoice->id,
                'message' => 'Theme purchased successfully! ' . 
                            ($sellerId > 0 ? '90% sent to theme owner, 10% commission to admin reserve.' : 
                             '100% sent to admin reserve (system theme).')
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Theme purchase error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }

public function themepurchasehistory(Request $request) 
{
    $user = Auth::user();

    $purchasesQuery = ThemePurchase::where('user_id', $user->id)
        ->where('status', 'completed')
        ->orderBy('created_at', 'desc')
        ->with([
            'invoice:id,theme_purchase_id,invoice_number,issue_date,amount',
            'theme:id,title,price,unique_id'
        ]);

    $paginatedPurchases = $purchasesQuery->paginate(10)->through(function ($purchase) {
        return [
            'id' => $purchase->id,
            'amount' => $purchase->amount,
            'currency' => $purchase->currency,
            'payment_method' => $purchase->payment_method,
            'status' => $purchase->status,
            'processed_at' => Carbon::parse($purchase->created_at)->format('Y-m-d H:i:s'),
            'transaction_id' => $purchase->transaction_id,
            'invoice' => $purchase->invoice ? [
                'number' => $purchase->invoice->invoice_number,
                'date' => Carbon::parse($purchase->invoice->issue_date)->format('Y-m-d'),
                'amount' => $purchase->invoice->amount
            ] : null,
            'theme' => $purchase->theme ? [
                'title' => $purchase->theme->title,
                'price' => $purchase->theme->price,
                'unique_id' => $purchase->theme->unique_id
            ] : null
        ];
    });
    
    // 2. Check if the request is an AJAX request
    if ($request->wantsJson()) {
        return response()->json($paginatedPurchases);
    }

    // 3. For initial load, render the full page with Inertia
    $template = Frontpage::where('frontpages.id', 1)
        ->join('templates', 'frontpages.theme_id', '=', 'templates.id')
        ->select('templates.*')
        ->first();

    return Inertia::render('themepurchasehistory', [
        'template' => $template,
        'auth' => [
            'user' => $user ?? null
        ],
        'purchases' => $paginatedPurchases
    ]);
}

public function sellerThemeHistory(Request $request) 
    {
        $user = Auth::user();

        // Get theme purchases where the current user is the seller
        $purchasesQuery = ThemePurchase::where('seller_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->with([
                'invoice:id,theme_purchase_id,invoice_number,issue_date,amount',
                'theme:id,title,price,unique_id',
                'user:id,name,email' // Include buyer information
            ]);

        $paginatedPurchases = $purchasesQuery->paginate(10)->through(function ($purchase) {
            return [
                'id' => $purchase->id,
                'amount' => $purchase->amount,
                'currency' => $purchase->currency,
                'payment_method' => $purchase->payment_method,
                'status' => $purchase->status,
                'processed_at' => Carbon::parse($purchase->created_at)->format('Y-m-d H:i:s'),
                'transaction_id' => $purchase->transaction_id,
                'seller_amount' => $purchase->seller_amount,
                'commission' => $purchase->commission,
                'invoice' => $purchase->invoice ? [
                    'number' => $purchase->invoice->invoice_number,
                    'date' => Carbon::parse($purchase->invoice->issue_date)->format('Y-m-d'),
                    'amount' => $purchase->invoice->amount
                ] : null,
                'theme' => $purchase->theme ? [
                    'title' => $purchase->theme->title,
                    'price' => $purchase->theme->price,
                    'unique_id' => $purchase->theme->unique_id
                ] : null,
                'buyer' => $purchase->user ? [
                    'name' => $purchase->user->name,
                    'email' => $purchase->user->email
                ] : null
            ];
        });
        
        // Check if the request is an AJAX request
        if ($request->wantsJson()) {
            return response()->json($paginatedPurchases);
        }

        // For initial load, render the full page with Inertia
        $template = Frontpage::where('frontpages.id', 1)
            ->join('templates', 'frontpages.theme_id', '=', 'templates.id')
            ->select('templates.*')
            ->first();

        return Inertia::render('SellerThemeHistory', [
            'template' => $template,
            'auth' => [
                'user' => $user ?? null
            ],
            'purchases' => $paginatedPurchases
        ]);
    }

    /**
     * Get seller earnings summary
     */
    public function sellerEarningsSummary(Request $request)
    {
        $user = Auth::user();

        $summary = ThemePurchase::where('seller_id', $user->id)
            ->selectRaw('
                COUNT(*) as total_sales,
                SUM(amount) as total_revenue,
                SUM(seller_amount) as total_earnings,
                SUM(commission) as total_commission,
                AVG(seller_amount) as average_earnings_per_sale
            ')
            ->first();

        $monthlyEarnings = ThemePurchase::where('seller_id', $user->id)
            ->where('status', 'completed')
            ->where('created_at', '>=', now()->subMonths(6))
            ->selectRaw('
                YEAR(created_at) as year,
                MONTH(created_at) as month,
                SUM(seller_amount) as monthly_earnings,
                COUNT(*) as monthly_sales
            ')
            ->groupBy('year', 'month')
            ->orderBy('year', 'desc')
            ->orderBy('month', 'desc')
            ->get();

        return response()->json([
            'summary' => $summary,
            'monthly_earnings' => $monthlyEarnings
        ]);
    }

    /**
     * Get sales analytics for the seller
     */
    public function salesAnalytics(Request $request)
    {
        $user = Auth::user();

        $timeframe = $request->get('timeframe', 'monthly'); // daily, weekly, monthly

        $query = ThemePurchase::where('seller_id', $user->id)
            ->where('status', 'completed');

        switch ($timeframe) {
            case 'daily':
                $salesData = $query->where('created_at', '>=', now()->subDays(30))
                    ->selectRaw('
                        DATE(created_at) as date,
                        COUNT(*) as sales_count,
                        SUM(seller_amount) as earnings
                    ')
                    ->groupBy('date')
                    ->orderBy('date')
                    ->get();
                break;

            case 'weekly':
                $salesData = $query->where('created_at', '>=', now()->subWeeks(12))
                    ->selectRaw('
                        YEAR(created_at) as year,
                        WEEK(created_at) as week,
                        COUNT(*) as sales_count,
                        SUM(seller_amount) as earnings
                    ')
                    ->groupBy('year', 'week')
                    ->orderBy('year')
                    ->orderBy('week')
                    ->get();
                break;

            case 'monthly':
            default:
                $salesData = $query->where('created_at', '>=', now()->subMonths(12))
                    ->selectRaw('
                        YEAR(created_at) as year,
                        MONTH(created_at) as month,
                        COUNT(*) as sales_count,
                        SUM(seller_amount) as earnings
                    ')
                    ->groupBy('year', 'month')
                    ->orderBy('year')
                    ->orderBy('month')
                    ->get();
                break;
        }

        $topThemes = ThemePurchase::where('seller_id', $user->id)
            ->where('status', 'completed')
            ->with('theme:id,title')
            ->selectRaw('
                theme_id,
                COUNT(*) as sales_count,
                SUM(seller_amount) as total_earnings
            ')
            ->groupBy('theme_id')
            ->orderBy('sales_count', 'desc')
            ->limit(10)
            ->get();

        return response()->json([
            'sales_data' => $salesData,
            'top_themes' => $topThemes,
            'timeframe' => $timeframe
        ]);
    }
	
public function showThemeInvoice($invoiceNumber)
{
    $user = Auth::user();
    
    // Get template for the page background
    $template = Frontpage::where('frontpages.id', 1)
        ->join('templates', 'frontpages.theme_id', '=', 'templates.id')
        ->select('templates.*')
        ->first();

    // Find the invoice with related theme purchase data
    $invoice = Invoice::where('invoice_number', $invoiceNumber)
        ->with(['themePurchase.user', 'themePurchase.theme'])
        ->firstOrFail();
    
    // Verify the invoice belongs to the user
    if ($invoice->user_id !== $user->id) {
        abort(403);
    }

    // Prepare theme details
    $theme = null;
    if ($invoice->themePurchase && $invoice->themePurchase->theme) {
        $theme = [
            'id' => $invoice->themePurchase->theme->id,
            'title' => $invoice->themePurchase->theme->title,
            'unique_id' => $invoice->themePurchase->theme->unique_id,
            'price' => $invoice->themePurchase->theme->price,
            'description' => $invoice->themePurchase->theme->description
        ];
    }

    // Prepare transaction details
    $transaction = [
        'id' => $invoice->themePurchase ? $invoice->themePurchase->transaction_id : 'N/A',
        'amount' => number_format($invoice->amount, 2),
        'currency' => $invoice->themePurchase ? $invoice->themePurchase->currency : 'USD',
        'status' => $invoice->status,
        'payment_method' => $invoice->themePurchase ? $this->formatPaymentMethod($invoice->themePurchase->payment_method) : 'N/A',
        'last4' => $this->getLast4($invoice->themePurchase)
    ];

    // Parse invoice items
    $items = [];
    try {
        $itemsData = is_array($invoice->items) ? $invoice->items : json_decode($invoice->items, true) ?? [];
        if (is_array($itemsData)) {
            $items = $itemsData;
        }
    } catch (\Exception $e) {
        // If JSON parsing fails, create a default item from the invoice data
        $items = [[
            'description' => 'Theme Purchase',
            'quantity' => 1,
            'unit_price' => $invoice->amount,
            'amount' => $invoice->amount
        ]];
    }

    // If no items found, create default from theme data
    if (empty($items) && $theme) {
        $items = [[
            'description' => "Theme Purchase: {$theme['title']} (ID: {$theme['unique_id']})",
            'quantity' => 1,
            'unit_price' => $invoice->amount,
            'amount' => $invoice->amount
        ]];
    }

    // Format items amounts
    foreach ($items as &$item) {
        if (isset($item['unit_price'])) {
            $item['unit_price'] = number_format($item['unit_price'], 2);
        }
        if (isset($item['amount'])) {
            $item['amount'] = number_format($item['amount'], 2);
        }
    }

    // Convert dates to Carbon instances for proper formatting
    $issueDate = Carbon::parse($invoice->issue_date);
    $dueDate = Carbon::parse($invoice->due_date);

    // Prepare the invoice data for the frontend
    $invoiceData = [
        'invoice_number' => $invoice->invoice_number,
        'issue_date' => $issueDate->format('M d, Y'),
        'due_date' => $dueDate->format('M d, Y'),
        'status' => $invoice->status,
        'amount' => number_format($invoice->amount, 2),
        'items' => $items,
        'notes' => $invoice->notes,
        'transaction' => $transaction,
        'theme' => $theme
    ];

    return Inertia::render('ThemeInvoice', [
        'template' => $template,
        'auth' => [
            'user' => $user
        ],
        'invoice' => $invoiceData
    ]);
}

/**
 * Format payment method for display
 */
private function formatPaymentMethod($paymentMethod)
{
    $formattedMethods = [
        'bee_points' => 'Bee Points',
        'stripe' => 'Credit Card',
        'card' => 'Credit Card',
        'paypal' => 'PayPal'
    ];

    return $formattedMethods[$paymentMethod] ?? ucfirst(str_replace('_', ' ', $paymentMethod));
}

/**
 * Get last 4 digits or identifier for payment method
 */
private function getLast4($themePurchase)
{
    if (!$themePurchase) {
        return '****';
    }

    if ($themePurchase->payment_method === 'bee_points') {
        return 'EZ$';
    }

    return '****';
}

public function showThemeSellInvoice($invoiceNumber)
    {
        $user = auth()->user();
        
        // Get the template for the frontpage
        $template = Frontpage::where('frontpages.id', 1)
            ->join('templates', 'frontpages.theme_id', '=', 'templates.id')
            ->select('templates.*')
            ->first();

        // Find the invoice with theme purchase relationship
        $invoice = Invoice::where('invoice_number', $invoiceNumber)
            ->with([
                'themePurchase.user:id,name,email',
                'themePurchase.seller:id,name,email',
                'themePurchase.theme:id,title,unique_id,price,description'
            ])
            ->firstOrFail();

        // Verify the invoice belongs to the user (either as buyer or seller)
        $isBuyer = $invoice->user_id === $user->id;
        $isSeller = $invoice->themePurchase && $invoice->themePurchase->seller_id === $user->id;
        
        if (!$isBuyer && !$isSeller) {
            abort(403, 'You are not authorized to view this invoice.');
        }

        // Get theme purchase details
        $themePurchase = $invoice->themePurchase;
        
        if (!$themePurchase) {
            abort(404, 'Theme purchase details not found for this invoice.');
        }

        // Prepare transaction details
        $transaction = [
            'id' => $themePurchase->transaction_id,
            'amount' => $themePurchase->amount,
            'currency' => $themePurchase->currency,
            'status' => $themePurchase->status,
            'payment_method' => $themePurchase->payment_method,
            'seller_amount' => $themePurchase->seller_amount,
            'commission' => $themePurchase->commission,
            'processed_at' => Carbon::parse($themePurchase->created_at)->format('M d, Y H:i:s')
        ];

        // Prepare theme details
        $themeDetails = $themePurchase->theme ? [
            'id' => $themePurchase->theme->id,
            'title' => $themePurchase->theme->title,
            'unique_id' => $themePurchase->theme->unique_id,
            'price' => $themePurchase->theme->price,
            'description' => $themePurchase->theme->description
        ] : null;

        // Prepare buyer details
        $buyerDetails = $themePurchase->user ? [
            'name' => $themePurchase->user->name,
            'email' => $themePurchase->user->email
        ] : null;

        // Prepare seller details
        $sellerDetails = $themePurchase->seller ? [
            'name' => $themePurchase->seller->name,
            'email' => $themePurchase->seller->email
        ] : null;

        // Parse invoice items (handle both array and JSON string)
        $invoiceItems = $invoice->items;
        if (is_string($invoiceItems)) {
            $invoiceItems = json_decode($invoiceItems, true);
        }

        // Determine user role for display purposes
        $userRole = $isBuyer ? 'buyer' : 'seller';

        return Inertia::render('ThemeSellInvoice', [
            'template' => $template,
            'auth' => [
                'user' => $user ?? null
            ],
            'invoice' => [
                'invoice_number' => $invoice->invoice_number,
                'issue_date' => Carbon::parse($invoice->issue_date)->format('M d, Y'),
                'due_date' => Carbon::parse($invoice->due_date)->format('M d, Y'),
                'status' => $invoice->status,
                'amount' => number_format(floatval($invoice->amount), 2),
                'items' => $invoiceItems ?? [],
                'notes' => $invoice->notes,
                'transaction' => $transaction,
                'theme' => $themeDetails,
                'buyer' => $buyerDetails,
                'seller' => $sellerDetails,
                'user_role' => $userRole,
                'is_paid' => $invoice->status === 'paid'
            ]
        ]);
    }

	public function themefunnel(Request $request)
	{            

		$defaultpage = Defaultpage::where('id', 3)->first();
		$originalFunnel = EzFunnel::findOrFail($defaultpage->handle_id);
		$clonedFunnel = $originalFunnel->replicate();
		$clonedFunnel->theme = implode(',',$request->template_ids);
		$clonedFunnel->user_id = auth()->id();
		$clonedFunnel->save();
		
		// Clone funnel fields, logo settings, SEO settings 
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
		$Funnel = EzFunnel::findOrFail($clonedFunnel->id);
		return response()->json([
			'message' => 'EZ Funnel saved successfully',
			'token' => $Funnel->token,
		]);
	}
		
	/**
     * Check if guests are allowed to interact with a conversation based on owner's settings
     */
    private function canGuestsInteract(?AISearchHistory $message): bool
    {
        if (!$message) {
            return true;
        }
        
        // Get the first message to find the conversation owner
        $firstMessage = $message->getFirstMessage();
        
        if (!$firstMessage || !$firstMessage->user_id) {
            // If no owner (older conversations or system messages), default to allowing guests
            return true;
        }
        
        // Get the owner's AI user settings
        $ownerSettings = AIUserSetting::where('user_id', $firstMessage->user_id)->first();
        
        // If settings exist and guest_ai_enabled is false, guests cannot interact
        if ($ownerSettings && $ownerSettings->guest_ai_enabled === false) {
            return false;
        }
        
        // Default to allowing guests
        return true;
    }

    /**
     * Enhanced check message access with guest interaction permissions
     */
    private function checkMessageAccess(AISearchHistory $message): bool
    {
        // If message is hidden, no access
        if ($message->status === 'hidden') {
            return false;
        }
        
        // If message is public, check if owner allows guest interaction
        if ($message->status === 'public') {
            // If user is authenticated, always allow access to public messages
            if (Auth::check()) {
                return true;
            }
            
            // For guests, check if owner allows guest interaction
            return $this->canGuestsInteract($message);
        }
        
        // If message is private, only owner can access
        if ($message->status === 'private') {
            return $this->isMessageOwner($message);
        }
        
        // Default to no access
        return false;
    }

    /**
     * Check if current user/session owns a message
     */
    private function isMessageOwner(AISearchHistory $message): bool
    {
        $user = Auth::user();
        $sessionId = Session::getId();
        
        if ($user && $message->user_id === $user->id) {
            return true;
        }
        
        if ($message->session_id === $sessionId) {
            return true;
        }
        
        return false;
    }

    /**
     * Enhanced filtered conversation messages with guest interaction permissions
     */
    private function getFilteredConversationMessages(string $conversationId)
    {
        AISearchHistory::ensureConversationPositions($conversationId);
        $messages = AISearchHistory::where('conversation_id', $conversationId)
            ->with('user')
            ->orderBy('position', 'asc')
            ->orderBy('created_at', 'asc')
            ->get();
        
        $user = Auth::user();
        $sessionId = Session::getId();
        
        // Check if owner allows guest interaction (for public messages)
        $firstMessage = $messages->first();
        $guestsAllowed = $this->canGuestsInteract($firstMessage);
        
        return $messages->filter(function ($message) use ($user, $sessionId, $guestsAllowed) {
            // Hidden messages: only owner can see
            if ($message->status === 'hidden') {
                return $this->isMessageOwner($message);
            }
            
            // Private messages: only owner can see
            if ($message->status === 'private') {
                return $this->isMessageOwner($message);
            }
            
            // Public messages
            if ($message->status === 'public') {
                // Authenticated users can always see public messages
                if ($user) {
                    return true;
                }
                
                // Guests can only see public messages if owner allows
                return $guestsAllowed;
            }
            
            return false;
        })->values();
    }

    /**
     * Check if user can ask questions in this conversation
     * This should be called before allowing a user to continue a conversation
     */
    private function canUserAskQuestion(AISearchHistory $conversation): bool
    {
        // Get the first message to check conversation settings
        $firstMessage = $conversation->getFirstMessage();
        
        if (!$firstMessage) {
            return false;
        }
        
        // Check basic access first
        if (!$this->checkMessageAccess($firstMessage)) {
            return false;
        }
        
        // If user is authenticated, they can ask
        if (Auth::check()) {
            return true;
        }
        
        // For guests, check if the conversation is public AND owner allows guest interaction
        if ($firstMessage->status === 'public') {
            return $this->canGuestsInteract($firstMessage);
        }
        
        // Private conversations require authentication
        return false;
    }
	
	public function genesis()
    {
        return view('genesis');
    }
	
	public function spec()
    {
        return view('spec');
    }
	
	public function provisional()
    {
        return view('provisional');
    }
	
}