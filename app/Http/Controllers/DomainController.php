<?php

namespace App\Http\Controllers;

use App\Models\Domain;
use App\Models\AISearchHistory;
use App\Models\EzFunnel;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class DomainController extends Controller
{
    /**
     * Display a listing of domains.
     *
     * @return \Inertia\Response
     */
    public function index()
    {
        $user = Auth::user();

        $query = Domain::with([
            'funnel' => function ($query) {
                // Eager load the AI search history via the correct relationship name
                $query->with(['aiSearchHistory' => function ($q) {
                    $q->select('id', 'slug', 'conversation_id', 'conversation_title', 'user_id');
                }]);
            },
            'sells',
        ])
        ->orderBy('created_at', 'desc');

        // If user is logged in, show their domains
        if ($user) {
            $query->where('user_id', $user->id);
        } else {
            // For guests, show domains with no user assigned
            $query->whereNull('user_id');
        }

        $domains = $query->paginate(20);

        // Transform domains to include handle, slug, and funnel info
        $domains->getCollection()->transform(function ($domain) {
            $funnel = $domain->funnel;
            $aiSearchHistory = $funnel ? $funnel->aiSearchHistory : null;

            return [
                'id' => $domain->id,
                'user_id' => $domain->user_id,
                'funnelid' => $domain->funnelid,
                'expire' => $domain->expire,
                'email' => $domain->email,
                'hashtag' => $domain->hashtag,
                'domain' => $domain->domain,
                'domainselected' => $domain->domainselected,
                'created_at' => $domain->created_at ? $domain->created_at->toISOString() : null,
                'updated_at' => $domain->updated_at ? $domain->updated_at->toISOString() : null,
                // Handle (X000324 format) — derived from the funnel token if available
                'handle' => $funnel && $funnel->token
                    ? $funnel->token
                    : ($domain->domain . '000324'),
                // Slug from related AI conversation
                'slug' => $aiSearchHistory ? $aiSearchHistory->slug : null,
                'conversation_id' => $aiSearchHistory ? $aiSearchHistory->conversation_id : null,
                'conversation_title' => $aiSearchHistory ? $aiSearchHistory->conversation_title : null,
                'funnel_token' => $funnel ? $funnel->token : null,
                'funnel_id' => $funnel ? $funnel->id : null,
                'sells' => $domain->sells ? $domain->sells->map(function ($sell) {
                    return [
                        'id' => $sell->id,
                        'price' => $sell->price,
                        'created_at' => $sell->created_at ? $sell->created_at->toISOString() : null,
                    ];
                })->values() : [],
            ];
        });

        return Inertia::render('DomainList', [
            'domains' => $domains,
            'totalDomains' => $domains->total(),
            'currentPage' => $domains->currentPage(),
            'lastPage' => $domains->lastPage(),
            'perPage' => $domains->perPage(),
            'auth' => [
                'user' => $user,
            ],
            'tooltips' => [],
        ]);
    }

    /**
     * Load more domains for pagination.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function loadMore(Request $request)
    {
        $request->validate([
            'page' => 'required|integer|min:1',
            'per_page' => 'nullable|integer|min:1|max:50',
        ]);

        $page = $request->input('page', 1);
        $perPage = $request->input('per_page', 20);
        $user = Auth::user();

        $query = Domain::with([
            'funnel' => function ($query) {
                $query->with(['aiSearchHistory' => function ($q) {
                    $q->select('id', 'slug', 'conversation_id', 'conversation_title', 'user_id');
                }]);
            },
            'sells',
        ])
        ->orderBy('created_at', 'desc');

        if ($user) {
            $query->where('user_id', $user->id);
        } else {
            $query->whereNull('user_id');
        }

        $domains = $query->paginate($perPage, ['*'], 'page', $page);

        $transformedDomains = $domains->getCollection()->map(function ($domain) {
            $funnel = $domain->funnel;
            $aiSearchHistory = $funnel ? $funnel->aiSearchHistory : null;

            return [
                'id' => $domain->id,
                'user_id' => $domain->user_id,
                'funnelid' => $domain->funnelid,
                'expire' => $domain->expire,
                'email' => $domain->email,
                'hashtag' => $domain->hashtag,
                'domain' => $domain->domain,
                'domainselected' => $domain->domainselected,
                'created_at' => $domain->created_at ? $domain->created_at->toISOString() : null,
                'updated_at' => $domain->updated_at ? $domain->updated_at->toISOString() : null,
                'handle' => $funnel && $funnel->token
                    ? $funnel->token
                    : ($domain->domain . '000324'),
                'slug' => $aiSearchHistory ? $aiSearchHistory->slug : null,
                'conversation_id' => $aiSearchHistory ? $aiSearchHistory->conversation_id : null,
                'conversation_title' => $aiSearchHistory ? $aiSearchHistory->conversation_title : null,
                'funnel_token' => $funnel ? $funnel->token : null,
                'funnel_id' => $funnel ? $funnel->id : null,
                'sells' => $domain->sells ? $domain->sells->map(function ($sell) {
                    return [
                        'id' => $sell->id,
                        'price' => $sell->price,
                        'created_at' => $sell->created_at ? $sell->created_at->toISOString() : null,
                    ];
                })->values() : [],
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $transformedDomains->values()->toArray(),
            'meta' => [
                'current_page' => $domains->currentPage(),
                'last_page' => $domains->lastPage(),
                'total' => $domains->total(),
                'per_page' => $domains->perPage(),
            ],
        ]);
    }

    /**
     * Get all slugs (conversations) belonging to the current user
     * that ALSO have an associated EzFunnel.
     *
     * Slugs without a funnel are excluded — they cannot be assigned to a domain.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getUserSlugs(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $search = $request->input('search', '');
        $limit = (int) $request->input('limit', 100);

        // Only fetch root conversations that have an EzFunnel linked via `aiid`
        $query = AISearchHistory::query()
            ->where('user_id', $user->id)
            ->whereNull('parent_id')
            ->whereNotNull('slug')
            // Only include slugs that have a matching EzFunnel for this user
            ->whereHas('ezFunnel', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->with(['ezFunnel' => function ($q) {
                $q->select('id', 'aiid', 'token', 'user_id');
            }])
            ->orderBy('created_at', 'desc');

        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('slug', 'LIKE', "%{$search}%")
                  ->orWhere('conversation_title', 'LIKE', "%{$search}%");
            });
        }

        $slugs = $query->limit($limit)->get()->map(function ($item) {
            $funnel = $item->ezFunnel;
            return [
                'id' => $item->id,
                'slug' => $item->slug,
                'conversation_id' => $item->conversation_id,
                'conversation_title' => $item->conversation_title,
                'funnel_id' => $funnel ? $funnel->id : null,
                'funnel_token' => $funnel ? $funnel->token : null,
                'created_at' => $item->created_at ? $item->created_at->toISOString() : null,
                'created_at_formatted' => $item->created_at ? $item->created_at->format('M d, Y') : null,
            ];
        });

        return response()->json([
            'success' => true,
            'slugs' => $slugs->values()->toArray(),
            'total' => $slugs->count(),
        ]);
    }

    /**
     * Assign a slug (conversation) to a domain by updating the domain's funnelid
     * to point to the funnel that owns that conversation.
     *
     * @param Request $request
     * @param int $domainId
     * @return \Illuminate\Http\JsonResponse
     */
    public function assignSlugToDomain(Request $request, $domainId)
    {
        $request->validate([
            'slug_id' => 'required|integer|exists:ai_search_histories,id',
        ]);

        $user = Auth::user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        // Find the domain, scoped to the current user
        $domain = Domain::where('id', $domainId)
            ->where('user_id', $user->id)
            ->first();

        if (!$domain) {
            return response()->json([
                'success' => false,
                'message' => 'Domain not found or unauthorized.',
            ], 404);
        }

        // Find the AI search history row (root conversation, must belong to user)
        $aiHistory = AISearchHistory::where('id', $request->slug_id)
            ->where('user_id', $user->id)
            ->whereNull('parent_id')
            ->first();

        if (!$aiHistory) {
            return response()->json([
                'success' => false,
                'message' => 'Slug not found or does not belong to you.',
            ], 404);
        }

        // Get the funnel associated with this conversation (via aiid -> EzFunnel.aiid)
        $funnel = EzFunnel::where('aiid', $aiHistory->id)
            ->where('user_id', $user->id)
            ->first();

        if (!$funnel) {
            return response()->json([
                'success' => false,
                'message' => 'No funnel found for this slug. Please create a funnel for this conversation first.',
            ], 404);
        }

        try {
            DB::beginTransaction();

            // Update the domain row -> point to the new funnel
            $domain->update([
                'funnelid' => $funnel->id,
            ]);

            DB::commit();

            Log::info('Domain funnel reassigned via slug selection', [
                'domain_id' => $domain->id,
                'domain' => $domain->domain . '.' . $domain->domainselected,
                'new_funnel_id' => $funnel->id,
                'slug' => $aiHistory->slug,
                'user_id' => $user->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Slug assigned to domain successfully.',
                'domain' => [
                    'id' => $domain->id,
                    'funnelid' => $funnel->id,
                    'funnel_token' => $funnel->token,
                    'slug' => $aiHistory->slug,
                    'conversation_id' => $aiHistory->conversation_id,
                    'conversation_title' => $aiHistory->conversation_title,
                    'handle' => $funnel->token,
                ],
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Failed to assign slug to domain', [
                'domain_id' => $domainId,
                'slug_id' => $request->slug_id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to assign slug. Please try again.',
            ], 500);
        }
    }

    /**
     * Update the slug for a domain directly (when no conversation is linked).
     * If a conversation IS linked, the slug should be updated via
     * AIHistoryController::updateSlug instead.
     *
     * @param Request $request
     * @param int $domainId
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateDomainSlug(Request $request, $domainId)
    {
        $request->validate([
            'slug' => 'required|string|min:2|max:100',
        ]);

        $user = Auth::user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $domain = Domain::where('id', $domainId)
            ->where('user_id', $user->id)
            ->first();

        if (!$domain) {
            return response()->json([
                'success' => false,
                'message' => 'Domain not found or unauthorized.',
            ], 404);
        }

        $cleanSlug = str_replace(' ', '-', $request->slug);

        // Check uniqueness across AISearchHistory (the slugs used at /X/{slug})
        $exists = AISearchHistory::where('slug', $cleanSlug)->exists();

        if ($exists) {
            return response()->json([
                'success' => false,
                'message' => 'This slug is already taken. Please choose another one.',
            ], 422);
        }

        try {
            DB::beginTransaction();

            // If the domain has a linked funnel + conversation, update via that path
            $funnel = $domain->funnel;
            $aiHistory = $funnel ? $funnel->aiSearchHistory : null;

            if ($aiHistory) {
                AISearchHistory::updateConversationSlug($aiHistory->conversation_id, $cleanSlug);
            }

            DB::commit();

            Log::info('Domain slug updated', [
                'domain_id' => $domain->id,
                'new_slug' => $cleanSlug,
                'user_id' => $user->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Slug updated successfully.',
                'slug' => $cleanSlug,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Failed to update domain slug', [
                'domain_id' => $domainId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update slug. Please try again.',
            ], 500);
        }
    }

    /**
     * Display a specific domain's details.
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id)
    {
        $user = Auth::user();

        $domain = Domain::with([
            'funnel' => function ($query) {
                $query->with(['aiSearchHistory' => function ($q) {
                    $q->select('id', 'slug', 'conversation_id', 'conversation_title', 'user_id');
                }]);
            },
            'sells',
            'user',
        ])
        ->where('id', $id)
        ->when($user, fn ($q) => $q->where('user_id', $user->id))
        ->first();

        if (!$domain) {
            return response()->json([
                'success' => false,
                'message' => 'Domain not found or unauthorized.',
            ], 404);
        }

        $funnel = $domain->funnel;
        $aiSearchHistory = $funnel ? $funnel->aiSearchHistory : null;

        return response()->json([
            'success' => true,
            'domain' => [
                'id' => $domain->id,
                'user_id' => $domain->user_id,
                'funnelid' => $domain->funnelid,
                'expire' => $domain->expire,
                'email' => $domain->email,
                'hashtag' => $domain->hashtag,
                'domain' => $domain->domain,
                'domainselected' => $domain->domainselected,
                'created_at' => $domain->created_at ? $domain->created_at->toISOString() : null,
                'updated_at' => $domain->updated_at ? $domain->updated_at->toISOString() : null,
                'handle' => $funnel && $funnel->token
                    ? $funnel->token
                    : ($domain->domain . '000324'),
                'slug' => $aiSearchHistory ? $aiSearchHistory->slug : null,
                'conversation_id' => $aiSearchHistory ? $aiSearchHistory->conversation_id : null,
                'conversation_title' => $aiSearchHistory ? $aiSearchHistory->conversation_title : null,
                'funnel_token' => $funnel ? $funnel->token : null,
                'funnel_id' => $funnel ? $funnel->id : null,
                'sells' => $domain->sells ? $domain->sells->map(function ($sell) {
                    return [
                        'id' => $sell->id,
                        'price' => $sell->price,
                        'created_at' => $sell->created_at ? $sell->created_at->toISOString() : null,
                    ];
                })->values() : [],
            ],
        ]);
    }

    /**
     * Update a domain's basic information.
     *
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, $id)
    {
        $request->validate([
            'domain' => 'sometimes|string|max:255',
            'domainselected' => 'sometimes|string|max:255',
            'email' => 'sometimes|nullable|email|max:255',
            'hashtag' => 'sometimes|nullable|string|max:255',
            'expire' => 'sometimes|nullable|date',
        ]);

        $user = Auth::user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $domain = Domain::where('id', $id)
            ->where('user_id', $user->id)
            ->first();

        if (!$domain) {
            return response()->json([
                'success' => false,
                'message' => 'Domain not found or unauthorized.',
            ], 404);
        }

        try {
            DB::beginTransaction();

            $domain->update($request->only([
                'domain',
                'domainselected',
                'email',
                'hashtag',
                'expire',
            ]));

            DB::commit();

            Log::info('Domain updated', [
                'domain_id' => $domain->id,
                'user_id' => $user->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Domain updated successfully.',
                'domain' => $domain->fresh(),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Failed to update domain', [
                'domain_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update domain. Please try again.',
            ], 500);
        }
    }

    /**
     * Delete a domain.
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($id)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $domain = Domain::where('id', $id)
            ->where('user_id', $user->id)
            ->first();

        if (!$domain) {
            return response()->json([
                'success' => false,
                'message' => 'Domain not found or unauthorized.',
            ], 404);
        }

        try {
            DB::beginTransaction();

            // Delete related sells first
            $domain->sells()->delete();

            // Delete the domain
            $domain->delete();

            DB::commit();

            Log::info('Domain deleted', [
                'domain_id' => $id,
                'user_id' => $user->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Domain deleted successfully.',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Failed to delete domain', [
                'domain_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete domain. Please try again.',
            ], 500);
        }
    }

    /**
     * Get statistics about the user's domains.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function stats()
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $total = Domain::where('user_id', $user->id)->count();
        $active = Domain::where('user_id', $user->id)
            ->where(function ($q) {
                $q->whereNull('expire')
                  ->orWhere('expire', '>=', now());
            })
            ->count();
        $expired = Domain::where('user_id', $user->id)
            ->whereNotNull('expire')
            ->where('expire', '<', now())
            ->count();
        $pending = Domain::where('user_id', $user->id)
            ->whereNull('expire')
            ->count();

        return response()->json([
            'success' => true,
            'stats' => [
                'total' => $total,
                'active' => $active,
                'expired' => $expired,
                'pending' => $pending,
            ],
        ]);
    }

    /**
     * Check if a slug is available for assignment.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function checkSlugAvailability(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'slug' => 'required|string|min:2|max:100',
            'domain_id' => 'nullable|integer|exists:domains,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'available' => false,
                'message' => 'Invalid slug format.',
            ], 422);
        }

        $slug = strtolower(trim($request->input('slug')));

        // Reserved slugs that cannot be used
        $reservedSlugs = [
            'admin', 'api', 'login', 'register', 'dashboard', 'home',
            'search', 'settings', 'profile', 'logout', 'X', 'x',
            'ez', 'wiki', 'ezbar', 'ezbar.ai', 'www', 'mail', 'ftp',
            'ai', 'searchai', 'content', 'qr', 'theme', 'funnel',
            'domains', 'domain', 'slug', 'slugs',
        ];

        if (in_array($slug, $reservedSlugs)) {
            return response()->json([
                'available' => false,
                'message' => 'This slug is reserved and cannot be used.',
            ]);
        }

        // Check if the slug exists in AISearchHistory
        $exists = AISearchHistory::where('slug', $slug)->exists();

        if ($exists) {
            return response()->json([
                'available' => false,
                'message' => 'This slug is already taken. Please choose another one.',
            ]);
        }

        return response()->json([
            'available' => true,
            'message' => 'Slug is available!',
            'slug' => $slug,
        ]);
    }

    /**
     * Get all domains for the current user as a simple list (for dropdowns/selects).
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function list()
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $domains = Domain::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($domain) {
                return [
                    'id' => $domain->id,
                    'domain' => $domain->domain,
                    'domainselected' => $domain->domainselected,
                    'full_domain' => $domain->domain . '.' . $domain->domainselected,
                    'funnelid' => $domain->funnelid,
                    'expire' => $domain->expire,
                    'created_at' => $domain->created_at ? $domain->created_at->toISOString() : null,
                ];
            });

        return response()->json([
            'success' => true,
            'domains' => $domains,
        ]);
    }

    /**
     * Unassign the slug/funnel from a domain.
     *
     * @param int $domainId
     * @return \Illuminate\Http\JsonResponse
     */
    public function unassignSlug($domainId)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $domain = Domain::where('id', $domainId)
            ->where('user_id', $user->id)
            ->first();

        if (!$domain) {
            return response()->json([
                'success' => false,
                'message' => 'Domain not found or unauthorized.',
            ], 404);
        }

        try {
            DB::beginTransaction();

            $domain->update([
                'funnelid' => null,
            ]);

            DB::commit();

            Log::info('Domain funnel unassigned', [
                'domain_id' => $domain->id,
                'user_id' => $user->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Slug unassigned from domain successfully.',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Failed to unassign slug from domain', [
                'domain_id' => $domainId,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to unassign slug. Please try again.',
            ], 500);
        }
    }
}