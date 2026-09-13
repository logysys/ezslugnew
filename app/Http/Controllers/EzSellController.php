<?php

namespace App\Http\Controllers;

use App\Models\EzFunnel;
use App\Models\EzFunnelField;
use App\Models\Frontpage;
use App\Models\EffectSetting;
use App\Models\FunnelSeoSetting;
use App\Models\Customdomain;
use App\Models\Domain;
use App\Models\Template;
use App\Models\Incentive;
use App\Models\UserBalance;
use App\Models\TokenTransaction;
use App\Models\Setting;
use App\Models\Page;
use App\Models\Sell;
use Inertia\Inertia;
use DOMDocument;
use DOMXPath;
use Spatie\ImageOptimizer\OptimizerChainFactory;
use Symfony\Component\DomCrawler\Crawler;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException; 
use Embed\Embed;
use Illuminate\Http\Request;
use Jenssegers\Agent\Agent;
use Illuminate\Support\Facades\Auth;

class EzSellController extends Controller
{
    public function ezsellprice()
	{
		$template = Frontpage::where('frontpages.id', 1)
			->join('templates', 'frontpages.theme_id', '=', 'templates.id')
			->select('templates.*')
			->first();
		
		// Get user's funnels with pagination and include sells
		$funnels = EzFunnel::where('user_id', auth()->id())
			->with(['customDomains.sells', 'handleDomains.sells'])
			->orderBy('created_at', 'desc')
			->paginate(10);

		return Inertia::render('ezsellprice', [
			'template' => $template,
			'auth' => [
				'user' => auth()->user() ?? null
			],
			'initialFunnels' => $funnels
		]);
	}

	public function saveDomainPrice(Request $request)
	{
		$request->validate([
			'domain_id' => 'required|integer',
			'type' => 'required|in:CUSTOM,DOMAIN',
			'price' => 'required|numeric|min:0'
		]);
		$sell = Sell::updateOrCreate(
			[
				'user_id' => auth()->id(),
				'sellid' => $request->domain_id,
				'type' => $request->type
			],
			[
				'uniquesellid' => time(),
				'price' => $request->price
			]
		);
		return response()->json(['success' => true]);
	}

	public function searchsell(Request $request)
{
    $request->validate([
        'query' => 'nullable|string',
        'type' => 'required|in:fuzzy,exact',
        'page' => 'nullable|integer|min:1'
    ]);

    try {
        $query = EzFunnel::with(['fields', 'customDomains.sells'])->with(['fields', 'handleDomains.sells'])
            ->where('user_id', auth()->id());

        $searchQuery = $request->input('query');
        
        if (!empty($searchQuery)) {
            if ($request->type === 'fuzzy') {
                $query->where(function($q) use ($searchQuery) {
                    $q->where('token', 'like', '%' . $searchQuery . '%')
                      ->orWhereHas('customDomains', function($subQuery) use ($searchQuery) {
                          $subQuery->where('domain', 'like', '%' . $searchQuery . '%');
                      })
					   ->orWhereHas('handleDomains', function($subQuery) use ($searchQuery) {
                          $subQuery->where('domain', 'like', '%' . $searchQuery . '%');
                      });
                });
            } else {
                $query->where(function($q) use ($searchQuery) {
                    $q->where('token', $searchQuery)
                      ->orWhereHas('customDomains', function($subQuery) use ($searchQuery) {
                          $subQuery->where('domain', $searchQuery);
                      })
					  ->orWhereHas('handleDomains', function($subQuery) use ($searchQuery) {
                          $subQuery->where('domain', $searchQuery);
                      });
                });
            }
        }

        $perPage = 10;
        return $query->orderBy('created_at', 'desc')
                   ->paginate($perPage, ['*'], 'page', $request->page);

    } catch (\Exception $e) {
        return response()->json([
            'message' => 'An error occurred while searching',
            'error' => $e->getMessage()
        ], 500);
    }
	}

}