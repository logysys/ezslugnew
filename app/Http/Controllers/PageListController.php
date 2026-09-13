<?php

namespace App\Http\Controllers;

use App\Models\PageGenerate;
use App\Models\Admindomain;
use App\Services\HtmlParserService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Carbon\Carbon;

class PageListController extends Controller
{
    public function __construct(
        private HtmlParserService $htmlParser
    ) {}

    /**
     * Display the page management dashboard
     */
    public function index()
    {
		
            $user = Auth::user();
            
            // Only show pages belonging to the current user
            $query = PageGenerate::with(['ezFunnel' => function($query) { 
                    $query->with([
                        'fields' => function($q) { 
                            $q->orderBy('position', 'asc')
                              ->with(['user' => function($uq) {
                                  $uq->select('id', 'email', 'name');
                              }]);
                        }, 
                        'customDomains',
                        'handleDomains'
                    ]);
                }])
                ->orderBy('created_at', 'desc');
                
            if ($user) {
                $query->where('user_id', $user->id);
            } else {
                // For guests, return empty or session-based? Usually pages require auth
                $query->where('user_id', null);
            }
            
            $pages = $query->paginate(20);
            
            Log::info('PageList index - Total pages: ' . $pages->total(), [
                'user_id' => $user?->id,
                'user_email' => $user?->email
            ]);
            
            $pages->getCollection()->transform(function ($page) {
                // Get EzFunnel token and id if exists
                $ezFunnelToken = null;
                $ezFunnelId = null;
                $customDomains = [];
                $handleDomains = [];
                
                if ($page->ezFunnel) {
                    $ezFunnelToken = $page->ezFunnel->token;
                    $ezFunnelId = $page->ezFunnel->id;
                    $customDomains = $page->ezFunnel->customDomains ?? [];
                    $handleDomains = $page->ezFunnel->handleDomains ?? [];
                }
                
                return [
                    'id' => $page->id,
                    'slug' => $page->slug,
                    'title' => $page->title,
                    'hasSecrets' => !empty($page->getAttributes()['secrets']),
                    'created_at' => $page->created_at->toISOString(),
                    'created_at_formatted' => $page->created_at->format('M d, Y \a\t h:i A'),
                    'updated_at' => $page->updated_at->toISOString(),
                    'updated_at_formatted' => $page->updated_at->format('M d, Y \a\t h:i A'),
                    'ezFunnelToken' => $ezFunnelToken,
                    'ezFunnelId' => $ezFunnelId,
                    'customDomains' => $customDomains,
                    'handleDomains' => $handleDomains,
                ];
            });
            
            $dayOfWeek = strtolower(Carbon::now()->format('D'));
            $domains = Admindomain::where('status', 'Active')
            ->where(function ($query) use ($dayOfWeek) {
                $query->where('days', 'all')
                    ->orWhere('days', 'LIKE', "%$dayOfWeek%");
            })
            ->orderBy('domain', 'ASC')
            ->get(['id', 'domain']);
            
            return Inertia::render('PageList', [
                'pages' => $pages,
                'domains' => $domains,
                'totalPages' => $pages->total(),
                'currentPage' => $pages->currentPage(),
                'lastPage' => $pages->lastPage(),
                'perPage' => $pages->perPage(),
                'auth' => [
                    'user' => $user ? [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                    ] : null,
                ],
            ]);
        
    }

    /**
     * Load more pages for infinite scroll - similar to AIHistoryController
     */
    public function loadMore(Request $request)
    {
        try {
            $request->validate([
                'page' => 'required|integer|min:1',
                'per_page' => 'nullable|integer|min:1|max:50',
            ]);
            
            $page = $request->input('page', 1);
            $perPage = $request->input('per_page', 20);
            $user = Auth::user();
            
            Log::info('loadMore called', [
                'page' => $page, 
                'perPage' => $perPage, 
                'user' => $user ? $user->id : 'guest'
            ]);
            
            $query = PageGenerate::with(['ezFunnel' => function($query) {
                $query->with(['customDomains', 'handleDomains']);
            }])->select('id', 'slug', 'title', 'created_at', 'updated_at', 'user_id')
                ->orderBy('created_at', 'desc');
                
            if ($user) {
                $query->where('user_id', $user->id);
            } else {
                $query->where('user_id', null);
            }
            
            $pages = $query->paginate($perPage, ['*'], 'page', $page);
            
            Log::info('loadMore - pages found', ['count' => $pages->count()]);
            
            $transformedPages = $pages->getCollection()->map(function ($page) {
                $ezFunnelToken = null;
                $ezFunnelId = null;
                $customDomains = [];
                $handleDomains = [];
                
                if ($page->ezFunnel) {
                    $ezFunnelToken = $page->ezFunnel->token;
                    $ezFunnelId = $page->ezFunnel->id;
                    $customDomains = $page->ezFunnel->customDomains ?? [];
                    $handleDomains = $page->ezFunnel->handleDomains ?? [];
                }
                
                return [
                    'id' => $page->id,
                    'slug' => $page->slug,
                    'title' => $page->title,
                    'hasSecrets' => !empty($page->getAttributes()['secrets']),
                    'created_at' => $page->created_at->toISOString(),
                    'created_at_formatted' => $page->created_at->format('M d, Y \a\t h:i A'),
                    'updated_at' => $page->updated_at->toISOString(),
                    'updated_at_formatted' => $page->updated_at->format('M d, Y \a\t h:i A'),
                    'ezFunnelToken' => $ezFunnelToken,
                    'ezFunnelId' => $ezFunnelId,
                    'customDomains' => $customDomains,
                    'handleDomains' => $handleDomains,
                ];
            });
            
            return response()->json([
                'success' => true,
                'data' => $transformedPages->values(),
                'meta' => [
                    'current_page' => $pages->currentPage(),
                    'last_page' => $pages->lastPage(),
                    'total' => $pages->total(),
                    'per_page' => $pages->perPage(),
                ],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::warning('Load more validation failed', ['errors' => $e->errors()]);
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Load more pages failed', [
                'error' => $e->getMessage(), 
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to load more pages: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get a single page with full details for editing
     */
    public function show($id)
    {
        try {
            $user = Auth::user();
            $page = PageGenerate::with(['ezFunnel' => function($query) {
                $query->with(['customDomains', 'handleDomains']);
            }])->findOrFail($id);
            
            // Check ownership
            if ($page->user_id !== $user?->id) {
                Log::warning('Unauthorized page access attempt', [
                    'page_id' => $id,
                    'user_id' => $user?->id,
                    'page_user_id' => $page->user_id
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 403);
            }
            
            $secrets = $page->getAttributes()['secrets'] ?? null;
            $decodedSecrets = $secrets ? json_decode($secrets, true) : [];
            
            $restoredHtml = null;
            if (!empty($page->processed_html)) {
                $restoredHtml = $this->htmlParser->renderPage($page->processed_html, $secrets);
            } elseif (!empty($page->html_content)) {
                $restoredHtml = $page->html_content;
            }
            
            $ezFunnelToken = null;
            $ezFunnelId = null;
            $customDomains = [];
            $handleDomains = [];
            
            if ($page->ezFunnel) {
                $ezFunnelToken = $page->ezFunnel->token;
                $ezFunnelId = $page->ezFunnel->id;
                $customDomains = $page->ezFunnel->customDomains ?? [];
                $handleDomains = $page->ezFunnel->handleDomains ?? [];
            }
            
            return response()->json([
                'success' => true,
                'page' => [
                    'id' => $page->id,
                    'slug' => $page->slug,
                    'title' => $page->title,
                    'html_content' => $page->html_content,
                    'processed_html' => $page->processed_html,
                    'restored_html' => $restoredHtml,
                    'hasSecrets' => !empty($secrets),
                    'secrets' => $decodedSecrets,
                    'created_at' => $page->created_at->toISOString(),
                    'created_at_formatted' => $page->created_at->format('M d, Y \a\t h:i A'),
                    'updated_at' => $page->updated_at->toISOString(),
                    'updated_at_formatted' => $page->updated_at->format('M d, Y \a\t h:i A'),
                    'ezFunnelToken' => $ezFunnelToken,
                    'ezFunnelId' => $ezFunnelId,
                    'customDomains' => $customDomains,
                    'handleDomains' => $handleDomains,
                ],
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            Log::warning('Page not found for show', ['id' => $id]);
            return response()->json([
                'success' => false,
                'message' => 'Page not found',
            ], 404);
        } catch (\Exception $e) {
            Log::error('Show page failed', [
                'error' => $e->getMessage(), 
                'trace' => $e->getTraceAsString(), 
                'id' => $id
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to load page: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update page title and slug
     */
    public function update(Request $request, $id)
    {
        try {
            $request->validate([
                'title' => 'required|string|max:255',
                'slug' => 'nullable|string|max:255|regex:/^[a-z0-9-]+$/',
            ]);

            $user = Auth::user();
            $page = PageGenerate::findOrFail($id);
            
            // Check ownership
            if ($page->user_id !== $user?->id) {
                Log::warning('Unauthorized page update attempt', [
                    'page_id' => $id,
                    'user_id' => $user?->id
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 403);
            }
            
            $updateData = ['title' => $request->title];
            
            if ($request->has('slug') && $request->slug !== $page->slug) {
                $slug = $request->slug;
                
                // Check if slug is already taken by another page
                if (PageGenerate::where('slug', $slug)->where('id', '!=', $id)->exists()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Slug already taken',
                    ], 422);
                }
                
                $updateData['slug'] = $slug;
            }
            
            DB::beginTransaction();
            $page->update($updateData);
            DB::commit();
            
            // Refresh the page to get updated timestamps
            $page->refresh();
            
            Log::info('Page updated successfully', [
                'page_id' => $id,
                'title' => $request->title,
                'slug' => $updateData['slug'] ?? $page->slug,
                'user_id' => $user?->id
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Page updated successfully',
                'page' => [
                    'id' => $page->id,
                    'slug' => $page->slug,
                    'title' => $page->title,
                    'hasSecrets' => !empty($page->getAttributes()['secrets']),
                    'updated_at' => $page->updated_at->toISOString(),
                    'updated_at_formatted' => $page->updated_at->format('M d, Y \a\t h:i A'),
                ],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::warning('Update page validation failed', ['errors' => $e->errors(), 'id' => $id]);
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            Log::warning('Page not found for update', ['id' => $id]);
            return response()->json([
                'success' => false,
                'message' => 'Page not found',
            ], 404);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Update page failed', [
                'error' => $e->getMessage(), 
                'trace' => $e->getTraceAsString(), 
                'id' => $id
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to update page: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update page HTML content
     */
    public function updateContent(Request $request, $id)
    {
        try {
            $request->validate([
                'html_content' => 'required|string',
            ]);

            $user = Auth::user();
            $page = PageGenerate::findOrFail($id);
            
            // Check ownership
            if ($page->user_id !== $user?->id) {
                Log::warning('Unauthorized content update attempt', [
                    'page_id' => $id,
                    'user_id' => $user?->id
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 403);
            }
            
            // Reprocess HTML with secrets
            $parsed = $this->htmlParser->processHtml($request->html_content);
            
            DB::beginTransaction();
            $page->update([
                'html_content' => $request->html_content,
                'processed_html' => $parsed['processedHtml'],
                'secrets' => !empty($parsed['secrets']) ? json_encode($parsed['secrets']) : null,
            ]);
            DB::commit();
            
            // Refresh to get updated timestamps
            $page->refresh();
            
            Log::info('Page content updated successfully', [
                'page_id' => $id,
                'title' => $page->title,
                'secrets_found' => count($parsed['secrets']),
                'user_id' => $user?->id
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Content updated successfully',
                'page' => [
                    'id' => $page->id,
                    'slug' => $page->slug,
                    'title' => $page->title,
                    'hasSecrets' => !empty($page->getAttributes()['secrets']),
                    'secrets_found' => count($parsed['secrets']),
                    'updated_at' => $page->updated_at->toISOString(),
                    'updated_at_formatted' => $page->updated_at->format('M d, Y \a\t h:i A'),
                ],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::warning('Update content validation failed', ['errors' => $e->errors(), 'id' => $id]);
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            Log::warning('Page not found for content update', ['id' => $id]);
            return response()->json([
                'success' => false,
                'message' => 'Page not found',
            ], 404);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Update content failed', [
                'error' => $e->getMessage(), 
                'trace' => $e->getTraceAsString(), 
                'id' => $id
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to update content: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete a page
     */
    public function destroy($id)
    {
        try {
            $user = Auth::user();
            $page = PageGenerate::findOrFail($id);
            
            // Check ownership
            if ($page->user_id !== $user?->id) {
                Log::warning('Unauthorized page deletion attempt', [
                    'page_id' => $id,
                    'user_id' => $user?->id
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 403);
            }
            
            // Check if there's an associated EzFunnel
            if ($page->ezFunnel) {
                Log::info('Page has associated EzFunnel', [
                    'page_id' => $id,
                    'ezfunnel_id' => $page->ezFunnel->id,
                    'ezfunnel_token' => $page->ezFunnel->token
                ]);
                // Optionally handle the EzFunnel deletion here
                // $page->ezFunnel->delete();
            }
            
            DB::beginTransaction();
            $page->delete();
            DB::commit();
            
            Log::info('Page deleted successfully', [
                'id' => $id, 
                'title' => $page->title,
                'user_id' => $user?->id
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Page deleted successfully',
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            Log::warning('Page not found for deletion', ['id' => $id]);
            return response()->json([
                'success' => false,
                'message' => 'Page not found',
            ], 404);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Delete page failed', [
                'error' => $e->getMessage(), 
                'trace' => $e->getTraceAsString(), 
                'id' => $id
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete page: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get page HTML content for iframe preview
     */
    public function preview($slug)
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
            
            // Add base tag for proper relative path resolution
            $html = str_replace(
                '</head>',
                '<base href="/"><style>body { margin: 0; padding: 0; }</style></head>',
                $html
            );
            
            return response($html, 200, [
                'Content-Type' => 'text/html; charset=utf-8',
                'X-Frame-Options' => 'SAMEORIGIN',
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            Log::warning('Page not found for preview', ['slug' => $slug]);
            return response('<h1>Page Not Found</h1>', 404, ['Content-Type' => 'text/html']);
        } catch (\Exception $e) {
            Log::error('Preview error', [
                'slug' => $slug, 
                'error' => $e->getMessage(), 
                'trace' => $e->getTraceAsString()
            ]);
            return response('<h1>Server Error</h1><p>' . htmlspecialchars($e->getMessage()) . '</p>', 500, ['Content-Type' => 'text/html']);
        }
    }

    /**
     * Check if a slug is available
     */
    public function checkSlugAvailability(Request $request)
    {
        try {
            $request->validate([
                'slug' => 'required|string|max:255|regex:/^[a-z0-9-]+$/',
                'page_id' => 'nullable|integer',
            ]);
            
            $slug = $request->slug;
            $pageId = $request->page_id;
            $user = Auth::user();
            
            $query = PageGenerate::where('slug', $slug);
            
            // Only check against user's own pages or all pages based on your logic
            if ($user) {
                $query->where('user_id', $user->id);
            }
            
            if ($pageId) {
                $query->where('id', '!=', $pageId);
            }
            
            $available = !$query->exists();
            
            return response()->json([
                'success' => true,
                'available' => $available,
                'message' => $available ? 'Slug is available' : 'Slug is already taken',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::warning('Check slug validation failed', ['errors' => $e->errors()]);
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Check slug availability failed', [
                'error' => $e->getMessage(), 
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to check slug availability: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get page stats for dashboard
     */
    public function getStats()
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 401);
            }
            
            $totalPages = PageGenerate::where('user_id', $user->id)->count();
            $pagesWithSecrets = PageGenerate::where('user_id', $user->id)
                ->whereNotNull('secrets')
                ->count();
            $recentPages = PageGenerate::where('user_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get();
            
            return response()->json([
                'success' => true,
                'stats' => [
                    'total_pages' => $totalPages,
                    'pages_with_secrets' => $pagesWithSecrets,
                    'recent_pages' => $recentPages->map(function ($page) {
                        return [
                            'id' => $page->id,
                            'slug' => $page->slug,
                            'title' => $page->title,
                            'created_at_formatted' => $page->created_at->format('M d, Y'),
                        ];
                    }),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Get stats failed', [
                'error' => $e->getMessage(), 
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to get stats: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Search pages by title or slug
     */
    public function search(Request $request)
    {
        try {
            $request->validate([
                'query' => 'required|string|min:1|max:255',
                'per_page' => 'nullable|integer|min:1|max:50',
            ]);
            
            $query = $request->input('query');
            $perPage = $request->input('per_page', 20);
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 401);
            }
            
            $pages = PageGenerate::select('id', 'slug', 'title', 'created_at', 'updated_at')
                ->where('user_id', $user->id)
                ->where(function($q) use ($query) {
                    $q->where('title', 'LIKE', "%{$query}%")
                      ->orWhere('slug', 'LIKE', "%{$query}%");
                })
                ->orderBy('created_at', 'desc')
                ->paginate($perPage);
            
            $transformedPages = $pages->getCollection()->map(function ($page) {
                return [
                    'id' => $page->id,
                    'slug' => $page->slug,
                    'title' => $page->title,
                    'hasSecrets' => !empty($page->getAttributes()['secrets']),
                    'created_at' => $page->created_at->toISOString(),
                    'created_at_formatted' => $page->created_at->format('M d, Y \a\t h:i A'),
                    'updated_at' => $page->updated_at->toISOString(),
                    'updated_at_formatted' => $page->updated_at->format('M d, Y \a\t h:i A'),
                ];
            });
            
            return response()->json([
                'success' => true,
                'data' => $transformedPages->values(),
                'meta' => [
                    'current_page' => $pages->currentPage(),
                    'last_page' => $pages->lastPage(),
                    'total' => $pages->total(),
                    'per_page' => $pages->perPage(),
                ],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::warning('Search validation failed', ['errors' => $e->errors()]);
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Search pages failed', [
                'error' => $e->getMessage(), 
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to search pages: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Export pages data
     */
    public function export(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 401);
            }
            
            $format = $request->input('format', 'json');
            $pages = PageGenerate::select('id', 'slug', 'title', 'created_at', 'updated_at')
                ->where('user_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->get();
            
            $data = $pages->map(function ($page) {
                return [
                    'id' => $page->id,
                    'slug' => $page->slug,
                    'title' => $page->title,
                    'has_secrets' => !empty($page->getAttributes()['secrets']),
                    'created_at' => $page->created_at->toISOString(),
                    'updated_at' => $page->updated_at->toISOString(),
                ];
            });
            
            if ($format === 'csv') {
                $csv = $this->arrayToCsv($data->toArray());
                return response($csv, 200, [
                    'Content-Type' => 'text/csv',
                    'Content-Disposition' => 'attachment; filename="pages_export_' . date('Y-m-d_His') . '.csv"',
                ]);
            }
            
            return response()->json([
                'success' => true,
                'data' => $data,
                'exported_at' => now()->toISOString(),
                'total' => $data->count(),
            ]);
        } catch (\Exception $e) {
            Log::error('Export pages failed', [
                'error' => $e->getMessage(), 
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to export pages: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Bulk delete pages
     */
    public function bulkDelete(Request $request)
    {
        try {
            $request->validate([
                'ids' => 'required|array|min:1',
                'ids.*' => 'required|integer|exists:page_generates,id',
            ]);
            
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 401);
            }
            
            $ids = $request->ids;
            
            // Verify ownership of all pages
            $ownPages = PageGenerate::whereIn('id', $ids)
                ->where('user_id', $user->id)
                ->pluck('id')
                ->toArray();
            
            if (count($ownPages) !== count($ids)) {
                return response()->json([
                    'success' => false,
                    'message' => 'One or more pages do not belong to you',
                ], 403);
            }
            
            DB::beginTransaction();
            $deletedCount = PageGenerate::whereIn('id', $ids)->delete();
            DB::commit();
            
            Log::info('Bulk delete completed', [
                'deleted_count' => $deletedCount, 
                'ids' => $ids,
                'user_id' => $user->id
            ]);
            
            return response()->json([
                'success' => true,
                'message' => "Successfully deleted {$deletedCount} page(s)",
                'deleted_count' => $deletedCount,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::warning('Bulk delete validation failed', ['errors' => $e->errors()]);
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Bulk delete failed', [
                'error' => $e->getMessage(), 
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete pages: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get page statistics by date range
     */
    public function getAnalytics(Request $request)
    {
        try {
            $request->validate([
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
            ]);
            
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 401);
            }
            
            $startDate = $request->input('start_date', now()->subDays(30)->startOfDay());
            $endDate = $request->input('end_date', now()->endOfDay());
            
            $stats = [
                'total_pages' => PageGenerate::where('user_id', $user->id)->count(),
                'pages_with_secrets' => PageGenerate::where('user_id', $user->id)
                    ->whereNotNull('secrets')
                    ->count(),
                'pages_created_in_period' => PageGenerate::where('user_id', $user->id)
                    ->whereBetween('created_at', [$startDate, $endDate])
                    ->count(),
                'pages_updated_in_period' => PageGenerate::where('user_id', $user->id)
                    ->whereBetween('updated_at', [$startDate, $endDate])
                    ->count(),
                'creation_by_day' => PageGenerate::where('user_id', $user->id)
                    ->selectRaw('DATE(created_at) as date, COUNT(*) as count')
                    ->whereBetween('created_at', [$startDate, $endDate])
                    ->groupBy('date')
                    ->orderBy('date', 'asc')
                    ->get(),
            ];
            
            return response()->json([
                'success' => true,
                'stats' => $stats,
                'period' => [
                    'start_date' => $startDate instanceof \DateTime ? $startDate->toISOString() : $startDate,
                    'end_date' => $endDate instanceof \DateTime ? $endDate->toISOString() : $endDate,
                ],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::warning('Get analytics validation failed', ['errors' => $e->errors()]);
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Get analytics failed', [
                'error' => $e->getMessage(), 
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to get analytics: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get pages by secret status
     */
    public function getBySecretStatus(Request $request)
    {
        try {
            $request->validate([
                'has_secrets' => 'required|boolean',
                'per_page' => 'nullable|integer|min:1|max:50',
            ]);
            
            $hasSecrets = $request->boolean('has_secrets');
            $perPage = $request->input('per_page', 20);
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 401);
            }
            
            $query = PageGenerate::select('id', 'slug', 'title', 'created_at', 'updated_at')
                ->where('user_id', $user->id);
            
            if ($hasSecrets) {
                $query->whereNotNull('secrets');
            } else {
                $query->whereNull('secrets');
            }
            
            $pages = $query->orderBy('created_at', 'desc')->paginate($perPage);
            
            $transformedPages = $pages->getCollection()->map(function ($page) {
                return [
                    'id' => $page->id,
                    'slug' => $page->slug,
                    'title' => $page->title,
                    'hasSecrets' => !empty($page->getAttributes()['secrets']),
                    'created_at' => $page->created_at->toISOString(),
                    'created_at_formatted' => $page->created_at->format('M d, Y \a\t h:i A'),
                    'updated_at' => $page->updated_at->toISOString(),
                    'updated_at_formatted' => $page->updated_at->format('M d, Y \a\t h:i A'),
                ];
            });
            
            return response()->json([
                'success' => true,
                'data' => $transformedPages->values(),
                'meta' => [
                    'current_page' => $pages->currentPage(),
                    'last_page' => $pages->lastPage(),
                    'total' => $pages->total(),
                    'per_page' => $pages->perPage(),
                ],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::warning('Get by secret status validation failed', ['errors' => $e->errors()]);
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Get by secret status failed', [
                'error' => $e->getMessage(), 
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to get pages: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Restore a soft-deleted page (if soft deletes are implemented)
     */
    public function restore($id)
    {
        try {
            // Note: This requires soft deletes to be enabled in the model
            // Add use SoftDeletes to PageGenerate model if you want to use this
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 401);
            }
            
            $page = PageGenerate::withTrashed()->findOrFail($id);
            
            // Check ownership
            if ($page->user_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 403);
            }
            
            if (!$page->trashed()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Page is not deleted',
                ], 400);
            }
            
            DB::beginTransaction();
            $page->restore();
            DB::commit();
            
            Log::info('Page restored successfully', [
                'id' => $id, 
                'title' => $page->title,
                'user_id' => $user->id
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Page restored successfully',
                'page' => [
                    'id' => $page->id,
                    'slug' => $page->slug,
                    'title' => $page->title,
                ],
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            Log::warning('Page not found for restore', ['id' => $id]);
            return response()->json([
                'success' => false,
                'message' => 'Page not found',
            ], 404);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Restore page failed', [
                'error' => $e->getMessage(), 
                'trace' => $e->getTraceAsString(), 
                'id' => $id
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to restore page: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Helper function to convert array to CSV
     */
    private function arrayToCsv(array $data): string
    {
        if (empty($data)) {
            return '';
        }
        
        $output = fopen('php://temp', 'r+');
        
        // Add headers
        fputcsv($output, array_keys($data[0]));
        
        // Add data rows
        foreach ($data as $row) {
            fputcsv($output, $row);
        }
        
        rewind($output);
        $csv = stream_get_contents($output);
        fclose($output);
        
        return $csv;
    }
	
}