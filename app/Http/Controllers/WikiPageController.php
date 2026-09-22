<?php

namespace App\Http\Controllers;

use App\Models\WikiPage;
use Illuminate\Http\Request;

class WikiPageController extends Controller
{
    
	public function show($slug)
    {
        // 1. Find the published page
        $wikiPage = WikiPage::where('wiki_slug', $slug)
            ->where('status', 'published')
            ->first();
		
        if (!$wikiPage) {
            abort(404, 'Wiki page not found');
        }

        // 2. Fix the HTML
        // Your database has encoded tags (e.g., &lt;div&gt;) which causes the code to show as text.
        // We decode them back to real HTML tags.
        $cleanHtml = html_entity_decode($wikiPage->html_content);

        // 3. Return Raw HTML
        // This bypasses Inertia and React completely.
        return response($cleanHtml)
            ->header('Content-Type', 'text/html');
    }
	
}