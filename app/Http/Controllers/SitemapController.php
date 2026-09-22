<?php

namespace App\Http\Controllers;

use App\Models\Admindomain;
use App\Models\WikiPage;
use App\Models\Template;
use App\Models\EzFunnelField;
use App\Models\EzFunnel;
use App\Models\Customdomain;
use App\Models\Domain;
use Illuminate\Http\Response;

class SitemapController extends Controller
{
    public function index()
    {
		$admindomain=Admindomain::where('status','Active')->get();
        // Static Pages
        $staticUrls = [
            '',
            '/video-remix',
            '/home',
            '/funnel-content-oki',
            '/privacy-policy',
            '/terms-and-conditions',
            '/marketplace',
			'/processmp4',
			'/template-marketplace',
			'/register',
			'/login',
			'/forgot-password',
			'/login/magic-link',
        ];
		$wiki=WikiPage::where('status','published')->get();
		$template=Template::get();
		$ezfunnelfield=EzFunnelField::get();
		$ezfunnel=EzFunnel::get();
		$customdomain=Customdomain::get();
		$domain=Domain::get();
        $content = view('sitemap', [
			'admindomain' => $admindomain,
            'staticUrls' => $staticUrls,
			'wiki' => $wiki,
			'template' => $template,
			'ezfunnelfield' => $ezfunnelfield,
			'ezfunnel' => $ezfunnel,
			'customdomain' => $customdomain,
			'domain' => $domain,
        ])->render();

        return response($content, 200)->header('Content-Type', 'text/xml');
    }
	
}