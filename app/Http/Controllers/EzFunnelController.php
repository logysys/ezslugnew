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
use App\Models\Emaildesign;
use App\Models\Admindomain;
use App\Models\TokenTransaction;
use App\Models\Setting;
use App\Models\Page;
use App\Models\Sell;
use App\Models\ReserveTransaction;
use App\Models\TokenInfo;
use App\Models\IncentiveHistory;
use App\Models\Invoice;
use App\Services\InvoiceService;
use App\Helpers\IframeHelper;
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
use Illuminate\Support\Facades\Mail;
use App\Mail\Eznew;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class EzFunnelController extends Controller
{
    public function store(Request $request)
    {
         $request->validate([
            'flySign' => 'required|boolean',
            'eyeTracking' => 'required|boolean',
			'visibility' => 'required|boolean',
            'seoTag' => 'nullable|string|max:255',
            'theme' => 'required|string|max:255',
            'color' => 'required|string|max:255',
            'transparency' => 'required',
			'designView' => 'required',
			'displaymode' => 'required',
			'autoApproveTime' => 'nullable|string|max:255',
            'mode' => 'nullable|string|max:255',
            'dynamicFields' => 'required|array',
            'dynamicFields.*.emojiMarker' => 'required|string',
            'dynamicFields.*.pinned' => 'required|boolean',
            'dynamicFields.*.customWidth' => 'nullable|integer|min:10|max:100',
            'dynamicFields.*.image' => 'nullable|file|mimes:jpeg,png,jpg,gif,svg,webp,pdf,mp4,webm,mov,avi,mp3,wav,ogg,m4a|max:102400',
        ]);
		
        $ezFunnel = EzFunnel::create([
        'user_id' => Auth::id(),
        'fly_sign' => $request->flySign,
        'eye_tracking' => $request->eyeTracking,
		'visibility' => $request->visibility,
        'seo_tag' => $request->seoTag,
		'timer' => $request->autoApproveTime,
        'theme' => $request->theme,
		'color' => $request->color,
		'transparency' => $request->transparency,
		'mode' => $request->mode ?? 'L',
		'designview' => $request->designView ?? 'A',
		'displaymode' => $request->displaymode ?? 'dressed',
		]);
		$setting = Setting::where('id', 1)->first();
		
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
			return '<img src="'.$image.'"  alt="Productivity App Interface" style="display:block;width:100%" >';
			}else
			{
				return '<img src="/bee.webp"  alt="Productivity App Interface" style="display:block;width:100%" >';
			}
		}
		function printfav(?string $image)
		{
			if ($image) {
			   return '<img src="'.$image.'" alt="Profile Picture" style="width:44px;height:44px;border-radius:50%;border:2px solid rgba(0,212,255,0.5);object-fit:cover;flex-shrink:0" >';
			}
			return null;
		}
		
		function random_color_part() {
		 return str_pad( dechex( mt_rand( 0, 255 ) ), 2, '0', STR_PAD_LEFT);
		}

		function random_color() {
		 return random_color_part() . random_color_part() . random_color_part();
		}
		foreach ($request->dynamicFields as $index => $field) {
			$imageUrl = null;

            if (isset($field['image']) && $field['image']->isValid()) {
                $file = $field['image'];
                $extension = $file->getClientOriginalExtension();
                $imageName = time() . '_' . Str::random(5) . '.' . $extension;
                $destinationPath = public_path('funnelcontent');

                if (!file_exists($destinationPath)) {
                    mkdir($destinationPath, 0755, true);
                }
                $file->move($destinationPath, $imageName);
                $imageUrl = 'funnelcontent/' . $imageName;
            }
			$htmlnotsupport=false;
			$aladinurlredirectembed='';
			$type='';
			$done='';
			if(isset($field['url'])){
			$parse = explode('/',$field['url']);
			$fullDomain = idn_to_utf8(get_domain($field['url']));
			$domains = Admindomain::where('domain', $fullDomain)->first();
			if(!empty($domains)){
				if (filter_var($field['url'], FILTER_VALIDATE_URL)) {
				$aladinurlredirectembed.='<iframe src="'.$field['url'].'" height="888" width="100%" frameborder="0" scrolling="yes" allowfullscreen="true"></iframe>';
				$done='done';	
				}
			}
			if(isset($parse[3])){
			$linkdomain=$parse[0].'//'.$parse[2].'/';
			$search=$parse[3];
			$urlnew=$field['url'];
			
			if('tiktok.com'==get_domain($field['url']) || 'www.tiktok.com'==get_domain($field['url'])){
				$aladinurlredirectembed.='<blockquote class="tiktok-embed" cite="'.$field['url'].'" data-unique-id="melonnt" data-embed-type="creator" style="max-width: 780px; min-width: 288px;" > <section> <a target="_blank" href="'.$field['url'].'?refer=creator_embed">'.$search.'</a> </section> </blockquote> <script async src="https://www.tiktok.com/embed.js"></script>';
				$done='done';
					
				}
			elseif($linkdomain=='https://kick.com/'){
				$aladinurlredirectembed.='<iframe src="https://player.kick.com/'.$search.'" height="888" width="100%" frameborder="0" scrolling="yes" allowfullscreen="true"></iframe>';
				$done='done';
					
				}elseif($linkdomain=='https://live.arrival.space/'){
				$aladinurlredirectembed.='<iframe src="https://live.arrival.space/'.$search.'" height="888" width="100%" frameborder="0" scrolling="yes" allowfullscreen="true"></iframe>';
				$done='done';
					
				}elseif('reddit.com'==get_domain($field['url']) || 'www.reddit.com'==get_domain($field['url'])){	
				$aladinurlredirectembed.='<blockquote class="reddit-embed-bq" style="height:500px" data-embed-height="740"><a href="'.$field['url'].'"></a></blockquote><script async="" src="https://embed.reddit.com/widgets.js" charset="UTF-8"></script>';
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
		curl_setopt($curl, CURLOPT_TIMEOUT, 15); // 15 second timeout for entire request
		curl_setopt($curl, CURLOPT_CONNECTTIMEOUT, 10); // 10 second timeout for connection
		curl_setopt($curl, CURLOPT_FOLLOWLOCATION, true); // Allow redirects
		$html = curl_exec($curl);
		$htmlnotsupport=$html;
		if($html!=false){
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
			
			if (!filter_var($field['url'], FILTER_VALIDATE_URL))
				{
					$aladinurlredirectembed.=$field['url'];
				}else
				{
				$urlparse = $field['url'];
				$parsed_url = parse_url($urlparse);
				if (isset($parsed_url['host'])) {
					$domain = $parsed_url['host'];
				} else {
					$domain = '';
				}
				$punycodeDomain = idn_to_ascii($domain); 
				$pndomain=str_replace($domain, $punycodeDomain, $field['url']);
					preg_match('%(?:youtube(?:-nocookie)?\.com/(?:[^/]+/.+/|(?:v|e(?:mbed)?)/|.*[?&]v=)|youtu\.be/)([^"&?/ ]{11})%i', $pndomain, $match);
					if(!empty($match))
					{
					$type='done';
					$aladinurlredirectembed.='<iframe loading="lazy" height="888px" src="https://www.youtube.com/embed/'.$match[1].'?controls=0&showinfo=0&rel=0" frameborder="0" allowfullscreen></iframe>';
					}
					preg_match('%^https?:\/\/(?:www\.|player\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)(?:[?]?.*)$%im', $pndomain, $match);
					if(!empty($match))
					{
					$type='done';
					$aladinurlredirectembed.='<iframe loading="lazy" allow="camera; microphone; fullscreen; display-capture; autoplay" src="https://player.vimeo.com/video/'.$match[3].'?h=33160d1512&color=de0101" width="100%" height="888px" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>';
					}
					preg_match('/^(https?:\/\/)?(www\.)?fb.watch\/[a-zA-Z0-9(\.\?)?]/', $pndomain, $match);
					if(!empty($match))
					{
					$type='done';
					$aladinurlredirectembed.='<div class="fb-video" data-href="'.$pndomain.'" data-width="500" data-show-text="true"></div>';
					}
					preg_match('/^(https?:\/\/)?(www\.)?facebook.com\/[a-zA-Z0-9(\.\?)?]/', $pndomain, $match);
					if(!empty($match))
					{
					if (strpos($pndomain,'groups') == false) {
							$type='done';
							$aladinurlredirectembed.='<div class="fb-post" data-href="'.$pndomain.'" data-width="500" data-show-text="true"></div>';
						}else
						{
						$str = ['{backimage}','{backcolor}','{favicon}','{providerName}','{loadingurl}','{image}','{title}','{description}'];
						$type='done';
						$curl = curl_init('https://api.microlink.io/?url='.$pndomain);
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
								$fav='<img src="'.$logo.'" alt="Profile Picture" style="width:44px;height:44px;border-radius:50%;border:2px solid rgba(0,212,255,0.5);object-fit:cover;flex-shrink:0" >';
								$rplc =['','',$fav,$publisher,$urlpage,printImage($image),printText($title),printText($description)];
								$code = Page::where('id',1)->value('code');
								$divstr=str_replace($str,$rplc,$code);
								$aladinurlredirectembed.=$divstr;
						}
					}
					preg_match('/^(https?:\/\/)?(www\.)?twitter.com\/[a-zA-Z0-9(\.\?)?]/', $pndomain, $match);
					if(!empty($match))
					{
					$type='done';
					$aladinurlredirectembed.='<blockquote class="twitter-tweet"><p lang="zxx" dir="ltr"><a href="'.$pndomain.'">'.$pndomain.'</a></p>&mdash; News (@XNews) <a href="'.$pndomain.'?ref_src=twsrc%5Etfw"></a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>';
					}
					preg_match('/^(https?:\/\/)?(www\.)?x.com\/[a-zA-Z0-9(\.\?)?]/', $pndomain, $match);
					if(!empty($match))
					{
					$type='done';
					$aladinurlredirectembed.='<blockquote class="twitter-tweet"><p lang="zxx" dir="ltr"><a href="'.$pndomain.'">'.$pndomain.'</a></p>&mdash; News (@XNews) <a href="'.$pndomain.'?ref_src=twsrc%5Etfw"></a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>';
					}
					if($type!='done')
					{
						if (filter_var($pndomain, FILTER_VALIDATE_URL)) {
							$isFriendly = IframeHelper::isIframeable($pndomain);
							if ($isFriendly) {
								$type='iframe';
							}else{
								$type='div';
							}
						} else {
							$type='text';
						}
						if($type=='text')
						{
							$aladinurlredirectembed.=$pndomain; 
						}
						
						if($type=='iframe')
						{
							$pattern = '/<iframe/i';
							preg_match($pattern, $pndomain, $match);
							if(!empty($match)) {
								$aladinurlredirectembed.=$pndomain;
							} else {
								$aladinurlredirectembed.='<iframe loading="lazy" allow="camera; microphone; fullscreen; display-capture; autoplay" style="border: 0;" src="'.$pndomain.'" width="100%" height="888px" allowfullscreen="allowfullscreen" ></iframe>';
							}
						}else{
						
							if($type!='text')
								{
								$scrapingurl=json_decode($setting['scrapingurl']);
								$scrp='OFF';
								for ($k = 0; $k < count($scrapingurl); $k++) { 
								if(get_domain($pndomain)==get_domain($scrapingurl[$k]))
								{
								$scrp='ON';
								}
								}
								
								if($scrp=='ON')
								{
								$curl = curl_init($pndomain);
								curl_setopt($curl, CURLOPT_RETURNTRANSFER, TRUE);
								curl_setopt($curl,CURLOPT_USERAGENT,'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.13) Gecko/20080311 Firefox/2.0.0.13');
								$page = curl_exec($curl);
								$page1 = str_replace('<button aria-label="Share" data-testid="ShareButton" style="transition:background-color 150ms ease" class="sc-pFZIQ sc-aemoO fRlsIx cBGtLF"><svg width="16" height="16" viewBox="0 0 16 16" enable-background="new 0 0 24 24" class="sc-gKsewC iPWGYb"><path fill-rule="evenodd" clip-rule="evenodd" d="M10.6464 3.85347L11 4.20702L11.7071 3.49992L11.3536 3.14636L8.35355 0.146362H7.64645L4.64645 3.14636L4.29289 3.49992L5 4.20702L5.35355 3.85347L7.5 1.70702V9.49992V9.99992H8.5V9.49992V1.70702L10.6464 3.85347ZM1 5.49994L1.5 4.99994H4V5.99994H2V14.9999H14V5.99994H12V4.99994H14.5L15 5.49994V15.4999L14.5 15.9999H1.5L1 15.4999V5.49994Z" fill="currentColor"></path></svg></button>',"",$page);
								$page2 = preg_replace('#<a href="/" class="sc-bdfBwQ Tmnro">(.*?)</a>#', '', $page1);
								$page3 = str_replace('<button id="ot-sdk-btn" class="ot-sdk-show-settings">Cookie Preferences</button>',"",$page2);
								$page4 = str_replace('https://linktr.ee',"https://4x4.ai",$page3);
								if(parse_url($pndomain, PHP_URL_HOST)=='lnk.bio')
								{
								$page4 = str_replace('href="/','href="https://lnk.bio/',$page4);
								$page4 = str_replace('src="/','src="https://lnk.bio/',$page4);
								$page4 = str_replace('https://lnk.bio//cdn.',"//cdn.",$page4);
								}
								$content = $page4.'<style>.dTcluo{ height:auto;}</style><script>$("#pb_cookie_consent").hide(); </script>';
								$time=time();


								$fp = fopen($_SERVER['DOCUMENT_ROOT'] . "/temp/".$time."temp.html","wb");
								fwrite($fp,$content);
								fclose($fp);
								$aladinurlredirectembed.='<iframe loading="lazy" allow="camera; microphone; fullscreen; display-capture; autoplay" style="border: 0;" src="temp/'.$time.'temp.html" width="100%" height="888px" allowfullscreen="allowfullscreen" ></iframe>';
								} else
								{
								if($htmlnotsupport!='false')
								{
								try {
								
								$embeded = new Embed();
								$info = $embeded->get($pndomain);
								$str = ['{backimage}','{backcolor}','{favicon}','{providerName}','{loadingurl}','{image}','{title}','{description}'];
								
								if(file_exists(printfav($info->favicon)))
								{
								$fav=printfav($info->favicon);	
								$rplc =['','',$fav,printText($info->providerName),$pndomain,printImage($info->image),printText($info->title),printText($info->description)];
								}else
								{
								$curl = curl_init('https://api.microlink.io/?url='.$pndomain);
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
								$fav='<img src="'.$logo.'" alt="Profile Picture" style="width:44px;height:44px;border-radius:50%;border:2px solid rgba(0,212,255,0.5);object-fit:cover;flex-shrink:0" >';
								$rplc =['','',$fav,$publisher,$urlpage,printImage($image),printText($title),printText($description)];
								}
								
								$code = Page::where('id',1)->value('code');
								$divstr=str_replace($str,$rplc,$code);
								$aladinurlredirectembed.=$divstr;
								} catch (Exception $e) {
									$aladinurlredirectembed.=$e->getMessage();
								}
								}else
								{
									$aladinurlredirectembed.='Unsupported domain.'.$pndomain;
								}
								}
								
								}	
						}
					}

				}
				
		}
			
			}
			$emojiMarker = $field['emojiMarker'];
			if ($request->visibility == 0 && trim($emojiMarker) == '0️⃣') {
				$emojiMarker = '1️⃣';
			}
			EzFunnelField::create([
				'ez_funnel_id' => $ezFunnel->id,
				'emoji_marker' => $emojiMarker,
				'unique_id' => null,
				'url' => $aladinurlredirectembed,
				'image_url' => $imageUrl,
                'link_url' => $field['linkUrl'] ?? '',
				'orignal_url' => $field['url'],
				'pinned' => $field['pinned'],
				'custom_width' => $field['customWidth'] ?? 33,
				'position' => $index,
			]);
		}
		
		$userBalance = UserBalance::where('user_id', Auth::id())->first();
		$incentive = Incentive::where('incentive_id', 2)->first();
		$amount = $incentive->amount;
		
		$incentiveHistory = IncentiveHistory::create([
                'incentive_id' => $incentive->incentive_id,
                'user_id' => Auth::id(),
                'amount' => $incentive->amount,
                'incentive_type' => $incentive->incentive_type,
                'description' => 'Create Funnel incentive',
                'status' => 'distributed',
                'reference_type' => 'Create Funnel',
                'reference_id' => Auth::id(),
                'distributed_at' => now(),
                'notes' => 'Automatically distributed upon Create Funnel incentive'
            ]);	
		
		$invoice = Invoice::create([
                'invoice_number' => 'INC-' . strtoupper(Str::random(8)),
                'user_id' => Auth::id(),
                'incentive_id' => $incentive->incentive_id,
                'issue_date' => now(),
                'due_date' => now()->addDays(30),
                'amount' => $incentive->amount,
                'status' => 'paid',
                'items' => [
                    [
                        'description' => "Create Funnel incentive",
                        'quantity' => 1,
                        'unit_price' => $incentive->amount,
                        'amount' => $incentive->amount,
                    ]
                ],
                'notes' => 'Thank you for create funnel! Enjoy your incentive EZ$.',
            ]);
		if ($userBalance) {
			$userBalance->bee_points_balance += $amount;
			$userBalance->save();
		} else {
			$userBalance = UserBalance::create([
				'user_id' => Auth::id(),
				'bee_points_balance' => $amount
			]);
		}		
		TokenTransaction::create([
                'user_id' => Auth::id(),
                'amount' => $incentive->amount, // Negative for deduction
                'transaction_type' => 'funnel_incentive',
                'balance_before' => $userBalance->bee_points_balance,
                'balance_after' => $userBalance->bee_points_balance + $incentive->amount,
            ]);
		$emaildesign = Emaildesign::where('id', 21)->first();
		$fullfunnel="https://ez.wiki/".$ezFunnel->token;
		$str = ['{fullfunnel}', '{incentive}', '{url}', '{createdate}'];
		$rplc = [$fullfunnel, $amount, $fullfunnel, now()];
		$div = str_replace($str, $rplc, $emaildesign['design']);
		$mailData = ['design' => $div];
		$email = Auth::user()->email;
		try {
			$subject = "Ez.wiki Congratulations on your new funnel.";
			Mail::to(strtolower($email))->send(new Eznew($mailData, $subject));
			Mail::getSymfonyTransport()->stop();
		} catch (\Exception $e) {
			$subject = "Ez.wiki Congratulations on your new funnel.";
			@mail($email, $subject, $div, null, 'funnel@ez.wiki');
		}	
		
		$tokenInfo = TokenInfo::first();
		if ($tokenInfo->reserved_supply < $incentive->amount) {
            throw new \Exception('Insufficient reserved supply');
        }

        $tokenInfo->reserved_supply -= $incentive->amount;
        $tokenInfo->last_updated = now();
        $tokenInfo->save();

		$invoiceNumber = 'TRF-RES-' . Str::upper(Str::random(8)) . '-' . now()->format('YmdHis');

        $transaction = ReserveTransaction::create([
            'transaction_type' => 'transfer_to_user',
            'amount' => $incentive->amount,
            'reason' => 'Funnel Incentive',
            'reference_id' => $invoiceNumber,
            'admin_id' => 2,
            'user_id' => Auth::id(),
            'recipient_email' => $email // Store the email for future reference
        ]);

		// Generate invoice
		InvoiceService::createForReserveTransaction($transaction);
		
		return response()->json([
			'message' => 'EZ Funnel saved successfully',
			'token' => $ezFunnel->token, // Include the token in response
			'funnel' => $ezFunnel->load('fields')
		], 201);
    }
	
	public function ezlist()
	{
		$template = Frontpage::where('frontpages.id', 1)
			->join('templates', 'frontpages.theme_id', '=', 'templates.id')
			->select('templates.*')
			->first();
		
		// Get user's funnels with pagination
		$funnels = EzFunnel::where('user_id', auth()->id())
			->with([
				'fields' => function($query) { 
					$query->orderBy('position', 'asc')
						  ->with(['user' => function($q) {
							  $q->select('id', 'email', 'name');
						  }]);
				}, 
				'customDomains', 
				'handleDomains',
				'aiSearchHistory' // Add this relationship
			])
			->orderBy('created_at', 'desc')
			->paginate(10);

		return Inertia::render('ezlist', [
			'template' => $template,
			'auth' => [
				'user' => auth()->user() ?? null,
				'linkedin_access_token' => auth()->user() ? auth()->user()->linkedin_access_token : null,
				'reddit_token' => auth()->user() ? auth()->user()->reddit_token : null,
			],
			'initialFunnels' => $funnels
		]);
	}

	public function search(Request $request)
	{
		$request->validate([
			'query' => 'nullable|string',
			'type' => 'required|in:fuzzy,exact',
			'page' => 'nullable|integer|min:1'
		]);

		try {
			$query = EzFunnel::with([
					'fields' => function($q) { $q->orderBy('position', 'asc'); },
					'customDomains',
					'handleDomains',
					'aiSearchHistory' // Add this relationship
				])
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

	public function update(Request $request)
	{
    $validatedData = $request->validate([
            'id' => 'required|exists:ez_funnels,id',
            'flySign' => 'required|boolean',
            'eyeTracking' => 'required|boolean',
			'visibility' => 'required|boolean',
            'seoTag' => 'nullable|string|max:255',
            'theme' => 'required|string|max:255',
            'color' => 'required|string|max:255',
            'transparency' => 'required|numeric',
			'designView' => 'required',
			'displaymode' => 'required',
			'autoApproveTime' => 'nullable|string|max:255',
            'mode' => 'nullable|string|max:255',
            'dynamicFields' => 'present|array',
            'dynamicFields.*.id' => 'nullable|integer',
            'dynamicFields.*.emojiMarker' => 'required|string',
            'dynamicFields.*.url' => 'nullable|string',
            'dynamicFields.*.linkUrl' => 'nullable|string',
            'dynamicFields.*.pinned' => 'required|boolean',
            'dynamicFields.*.customWidth' => 'nullable|integer|min:10|max:100',
            'dynamicFields.*.post_type' => 'nullable|string',
            'dynamicFields.*.image' => 'nullable|file|mimes:jpeg,png,jpg,gif,svg,webp,pdf,mp4,webm,mov,avi,mp3,wav,ogg,m4a|max:102400',
            'dynamicFields.*.imageUrl' => 'nullable|string',
			'dynamicFields.*.approve' => 'nullable|string',
        ]);
	DB::beginTransaction();
    $ezFunnel = EzFunnel::findOrFail($validatedData['id']);
    
    $ezFunnel->update([
                'fly_sign' => $validatedData['flySign'],
                'eye_tracking' => $validatedData['eyeTracking'],
				'visibility' => $validatedData['visibility'],
				'timer' => $validatedData['autoApproveTime'],
                'seo_tag' => $validatedData['seoTag'],
                'theme' => $validatedData['theme'],
                'color' => $validatedData['color'],
                'transparency' => $validatedData['transparency'],
                'mode' => $validatedData['mode'] ?? 'L',
				'designview' => $validatedData['designView'] ?? 'A',
				'displaymode' => $validatedData['displaymode'] ?? 'dressed',
            ]);

            $incomingFields = $validatedData['dynamicFields'];
            $incomingFieldIds = collect($incomingFields)->pluck('id')->filter()->all();
            $existingFieldIds = $ezFunnel->fields()->pluck('id')->all();
	
	$fieldIdsToDelete = array_diff($existingFieldIds, $incomingFieldIds);
            if (!empty($fieldIdsToDelete)) {
                $fieldsToDeleteModels = EzFunnelField::whereIn('id', $fieldIdsToDelete)->get();
                foreach ($fieldsToDeleteModels as $fieldModel) {
                    if ($fieldModel->image_url && file_exists(public_path($fieldModel->image_url))) {
                        @unlink(public_path($fieldModel->image_url));
                    }
                }
                EzFunnelField::destroy($fieldIdsToDelete);
            }
	$setting = Setting::where('id', 1)->first();
	
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
			return '<img src="'.$image.'"  alt="Productivity App Interface" style="display:block;width:100%" >';
			}else
			{
				return '<img src="/bee.webp"  alt="Productivity App Interface" style="display:block;width:100%" >';
			}
		}
		function printfav(?string $image)
		{
			if ($image) {
			   return '<img src="'.$image.'" alt="Profile Picture" style="width:44px;height:44px;border-radius:50%;border:2px solid rgba(0,212,255,0.5);object-fit:cover;flex-shrink:0" >';
			}
			return null;
		}
		
		function random_color_part() {
		 return str_pad( dechex( mt_rand( 0, 255 ) ), 2, '0', STR_PAD_LEFT);
		}

		function random_color() {
		 return random_color_part() . random_color_part() . random_color_part();
		}
    
    foreach ($incomingFields as $index => $fieldData) {
			$fieldId = $fieldData['id'] ?? null;
			$existingField = $fieldId ? EzFunnelField::find($fieldId) : null;

			// Start with the current DB value as the default
			$imageUrlToSave = $existingField ? $existingField->image_url : null;

			$hasNewImageUpload = isset($fieldData['image']) && $fieldData['image']->isValid();
			// Check if imageUrl is present and is an empty string, which is our signal to delete.
			// Case 1: A new image is uploaded. This takes precedence.
			$imageUrlFromRequest = $fieldData['imageUrl'] ?? null;
			if ($hasNewImageUpload) {
				// Delete the old image if it exists
				if ($imageUrlToSave && file_exists(public_path($imageUrlToSave))) {
					@unlink(public_path($imageUrlToSave));
				}
				
				// Save the new image
				$file = $fieldData['image'];
				$extension = $file->getClientOriginalExtension();
				$imageName = time() . '_' . Str::random(5) . '.' . $extension;
				$destinationPath = public_path('funnelcontent');
				if (!file_exists($destinationPath)) {
					mkdir($destinationPath, 0755, true);
				}
				$file->move($destinationPath, $imageName);
				$imageUrlToSave = 'funnelcontent/' . $imageName;
			} 
			// Case 2: No new image, but the existing one was explicitly cleared on the frontend.
			else if ($imageUrlFromRequest === '') {
				
                    if ($imageUrlToSave && file_exists(public_path($imageUrlToSave))) {
                        @unlink(public_path($imageUrlToSave));
                    }
                    $imageUrlToSave = null;
                }
			$htmlnotsupport=false;
			$aladinurlredirectembed='';
			$type='';
			$done='';
			if(isset($fieldData['url'])){
			$parse = explode('/',$fieldData['url']);
			$fullDomain = idn_to_utf8(get_domain($fieldData['url']));
			$domains = Admindomain::where('domain', $fullDomain)->first();
			if(!empty($domains)){
				if (filter_var($fieldData['url'], FILTER_VALIDATE_URL)) {
				$aladinurlredirectembed.='<iframe src="'.$fieldData['url'].'" height="888" width="100%" frameborder="0" scrolling="yes" allowfullscreen="true"></iframe>';
				$done='done';	
				}
			}
			if(isset($parse[3])){
			$linkdomain=$parse[0].'//'.$parse[2].'/';
			$search=$parse[3];
			$urlnew=$fieldData['url'];
			if('tiktok.com'==get_domain($fieldData['url']) || 'www.tiktok.com'==get_domain($fieldData['url'])){
				$aladinurlredirectembed.='<blockquote class="tiktok-embed" cite="'.$fieldData['url'].'" data-unique-id="melonnt" data-embed-type="creator" style="max-width: 780px; min-width: 288px;" > <section> <a target="_blank" href="'.$fieldData['url'].'?refer=creator_embed">'.$search.'</a> </section> </blockquote> <script async src="https://www.tiktok.com/embed.js"></script>';
				$done='done';
					
				}
			elseif($linkdomain=='https://kick.com/'){
				$aladinurlredirectembed.='<iframe src="https://player.kick.com/'.$search.'" height="888" width="100%" frameborder="0" scrolling="yes" allowfullscreen="true"></iframe>';
				$done='done';
					
				}elseif($linkdomain=='https://live.arrival.space/'){
				$aladinurlredirectembed.='<iframe src="https://live.arrival.space/'.$search.'" height="888" width="100%" frameborder="0" scrolling="yes" allowfullscreen="true"></iframe>';
				$done='done';
					
				}elseif('reddit.com'==get_domain($fieldData['url']) || 'www.reddit.com'==get_domain($fieldData['url'])){	
				$aladinurlredirectembed.='<blockquote class="reddit-embed-bq" style="height:500px" data-embed-height="740"><a href="'.$fieldData['url'].'"></a></blockquote><script async="" src="https://embed.reddit.com/widgets.js" charset="UTF-8"></script>';
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
		curl_setopt($curl, CURLOPT_TIMEOUT, 15); // 15 second timeout for entire request
		curl_setopt($curl, CURLOPT_CONNECTTIMEOUT, 10); // 10 second timeout for connection
		curl_setopt($curl, CURLOPT_FOLLOWLOCATION, true); // Allow redirects
		$html = curl_exec($curl);
		$htmlnotsupport=$html;
		if($html!=false){
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
			
			if (!filter_var($fieldData['url'], FILTER_VALIDATE_URL))
				{
					$aladinurlredirectembed.=$fieldData['url'];
				}else
				{
				$urlparse = $fieldData['url'];
				$parsed_url = parse_url($urlparse);
				if (isset($parsed_url['host'])) {
					$domain = $parsed_url['host'];
				} else {
					$domain = '';
				}
				$punycodeDomain = idn_to_ascii($domain); 
				$pndomain=str_replace($domain, $punycodeDomain, $fieldData['url']);
					preg_match('%(?:youtube(?:-nocookie)?\.com/(?:[^/]+/.+/|(?:v|e(?:mbed)?)/|.*[?&]v=)|youtu\.be/)([^"&?/ ]{11})%i', $pndomain, $match);
					if(!empty($match))
					{
					$type='done';
					$aladinurlredirectembed.='<iframe loading="lazy" height="888px" src="https://www.youtube.com/embed/'.$match[1].'?controls=0&showinfo=0&rel=0" frameborder="0" allowfullscreen></iframe>';
					}
					preg_match('%^https?:\/\/(?:www\.|player\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)(?:[?]?.*)$%im', $pndomain, $match);
					if(!empty($match))
					{
					$type='done';
					$aladinurlredirectembed.='<iframe loading="lazy" allow="camera; microphone; fullscreen; display-capture; autoplay" src="https://player.vimeo.com/video/'.$match[3].'?h=33160d1512&color=de0101" width="100%" height="888px" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>';
					}
					preg_match('/^(https?:\/\/)?(www\.)?fb.watch\/[a-zA-Z0-9(\.\?)?]/', $pndomain, $match);
					if(!empty($match))
					{
					$type='done';
					$aladinurlredirectembed.='<div class="fb-video" data-href="'.$pndomain.'" data-width="500" data-show-text="true"></div>';
					}
					preg_match('/^(https?:\/\/)?(www\.)?facebook.com\/[a-zA-Z0-9(\.\?)?]/', $pndomain, $match);
					if(!empty($match))
					{
					if (strpos($pndomain,'groups') == false) {
							$type='done';
							$aladinurlredirectembed.='<div class="fb-post" data-href="'.$pndomain.'" data-width="500" data-show-text="true"></div>';
						}else
						{
						$str = ['{backimage}','{backcolor}','{favicon}','{providerName}','{loadingurl}','{image}','{title}','{description}'];
						$type='done';
						$curl = curl_init('https://api.microlink.io/?url='.$pndomain);
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
								$fav='<img src="'.$logo.'"  alt="Profile Picture" style="width:44px;height:44px;border-radius:50%;border:2px solid rgba(0,212,255,0.5);object-fit:cover;flex-shrink:0" >';
								$rplc =['','',$fav,$publisher,$urlpage,printImage($image),printText($title),printText($description)];
								$code = Page::where('id',1)->value('code');
								$divstr=str_replace($str,$rplc,$code);
								$aladinurlredirectembed.=$divstr;
						}
					}
					preg_match('/^(https?:\/\/)?(www\.)?twitter.com\/[a-zA-Z0-9(\.\?)?]/', $pndomain, $match);
					if(!empty($match))
					{
					$type='done';
					$aladinurlredirectembed.='<blockquote class="twitter-tweet"><p lang="zxx" dir="ltr"><a href="'.$pndomain.'">'.$pndomain.'</a></p>&mdash; News (@XNews) <a href="'.$pndomain.'?ref_src=twsrc%5Etfw"></a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>';
					}
					preg_match('/^(https?:\/\/)?(www\.)?x.com\/[a-zA-Z0-9(\.\?)?]/', $pndomain, $match);
					if(!empty($match))
					{
					$type='done';
					$aladinurlredirectembed.='<blockquote class="twitter-tweet"><p lang="zxx" dir="ltr"><a href="'.$pndomain.'">'.$pndomain.'</a></p>&mdash; News (@XNews) <a href="'.$pndomain.'?ref_src=twsrc%5Etfw"></a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>';
					}
					if($type!='done')
					{
						if (filter_var($pndomain, FILTER_VALIDATE_URL)) {
							$isFriendly = IframeHelper::isIframeable($pndomain);
							if ($isFriendly) {
								$type='iframe';
							}else{
								$type='div';
							}
						} else {
							$type='text';
						}
						if($type=='text')
						{
							$aladinurlredirectembed.=$pndomain; 
						}
						if($type=='iframe')
						{
							$pattern = '/<iframe/i';
							preg_match($pattern, $pndomain, $match);
							if(!empty($match)) {
								$aladinurlredirectembed.=$pndomain;
							} else {
								$aladinurlredirectembed.='<iframe loading="lazy" allow="camera; microphone; fullscreen; display-capture; autoplay" style="border: 0;" src="'.$pndomain.'" width="100%" height="888px" allowfullscreen="allowfullscreen" ></iframe>';
							}
						}else{
						
							if($type!='text')
								{
								$scrapingurl=json_decode($setting['scrapingurl']);
								$scrp='OFF';
								for ($k = 0; $k < count($scrapingurl); $k++) { 
								if(get_domain($pndomain)==get_domain($scrapingurl[$k]))
								{
								$scrp='ON';
								}
								}
								
								if($scrp=='ON')
								{
								$curl = curl_init($pndomain);
								curl_setopt($curl, CURLOPT_RETURNTRANSFER, TRUE);
								curl_setopt($curl,CURLOPT_USERAGENT,'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.13) Gecko/20080311 Firefox/2.0.0.13');
								$page = curl_exec($curl);
								$page1 = str_replace('<button aria-label="Share" data-testid="ShareButton" style="transition:background-color 150ms ease" class="sc-pFZIQ sc-aemoO fRlsIx cBGtLF"><svg width="16" height="16" viewBox="0 0 16 16" enable-background="new 0 0 24 24" class="sc-gKsewC iPWGYb"><path fill-rule="evenodd" clip-rule="evenodd" d="M10.6464 3.85347L11 4.20702L11.7071 3.49992L11.3536 3.14636L8.35355 0.146362H7.64645L4.64645 3.14636L4.29289 3.49992L5 4.20702L5.35355 3.85347L7.5 1.70702V9.49992V9.99992H8.5V9.49992V1.70702L10.6464 3.85347ZM1 5.49994L1.5 4.99994H4V5.99994H2V14.9999H14V5.99994H12V4.99994H14.5L15 5.49994V15.4999L14.5 15.9999H1.5L1 15.4999V5.49994Z" fill="currentColor"></path></svg></button>',"",$page);
								$page2 = preg_replace('#<a href="/" class="sc-bdfBwQ Tmnro">(.*?)</a>#', '', $page1);
								$page3 = str_replace('<button id="ot-sdk-btn" class="ot-sdk-show-settings">Cookie Preferences</button>',"",$page2);
								$page4 = str_replace('https://linktr.ee',"https://4x4.ai",$page3);
								if(parse_url($pndomain, PHP_URL_HOST)=='lnk.bio')
								{
								$page4 = str_replace('href="/','href="https://lnk.bio/',$page4);
								$page4 = str_replace('src="/','src="https://lnk.bio/',$page4);
								$page4 = str_replace('https://lnk.bio//cdn.',"//cdn.",$page4);
								}
								$content = $page4.'<style>.dTcluo{ height:auto;}</style><script>$("#pb_cookie_consent").hide(); </script>';
								$time=time();


								$fp = fopen($_SERVER['DOCUMENT_ROOT'] . "/temp/".$time."temp.html","wb");
								fwrite($fp,$content);
								fclose($fp);
								$aladinurlredirectembed.='<iframe loading="lazy" allow="camera; microphone; fullscreen; display-capture; autoplay" style="border: 0;" src="temp/'.$time.'temp.html" width="100%" height="888px" allowfullscreen="allowfullscreen" ></iframe>';
								} else
								{
								if($htmlnotsupport!='false')
								{
								try {

								$embeded = new Embed();
								$info = $embeded->get($pndomain);
								$str = ['{backimage}','{backcolor}','{favicon}','{providerName}','{loadingurl}','{image}','{title}','{description}'];
								
								if(file_exists(printfav($info->favicon)))
								{
								$fav=printfav($info->favicon);	
								$rplc =['','',$fav,printText($info->providerName),$pndomain,printImage($info->image),printText($info->title),printText($info->description)];
								}else
								{
								$curl = curl_init('https://api.microlink.io/?url='.$pndomain);
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
								$fav='<img src="'.$logo.'" alt="Profile Picture" style="width:44px;height:44px;border-radius:50%;border:2px solid rgba(0,212,255,0.5);object-fit:cover;flex-shrink:0" >';
								$rplc =['','',$fav,$publisher,$urlpage,printImage($image),printText($title),printText($description)];
								}
								
								$code = Page::where('id',1)->value('code');
								$divstr=str_replace($str,$rplc,$code);
								$aladinurlredirectembed.=$divstr;
								} catch (Exception $e) {
									$aladinurlredirectembed.=$e->getMessage();
								}
								}else
								{
									$aladinurlredirectembed.='Unsupported domain.'.$pndomain;
								}
								}
								
								}	
						}
					}

				}
				
		}
			
			}
		$emojiMarker = $fieldData['emojiMarker'];
		if ($validatedData['visibility'] == 0 && trim($emojiMarker) == '0️⃣') {
			$emojiMarker = '1️⃣';
		}
		$approve = $fieldData['approve'] ?? 'APPROVED';
		if($emojiMarker!='0️⃣')
		{
			$approve='APPROVED';
		}
		EzFunnelField::updateOrCreate(
                    [
                        'id' => $fieldData['id'] ?? null,
                    ],
                    [
                        'ez_funnel_id' => $ezFunnel->id, 
                        'emoji_marker' => $emojiMarker,
                        'url' => $aladinurlredirectembed,
						'image_url' => $imageUrlToSave, 
						'link_url' => $fieldData['linkUrl'] ?? '',
						'orignal_url' => $fieldData['url'] ?? '',
                        'pinned' => $fieldData['pinned'],
                        'custom_width' => $fieldData['customWidth'] ?? 33,
                        'post_type' => $fieldData['post_type'] ?? 'user',
						'approve' => $approve,
                        'position' => $index, 
                    ]
                );
    }
	DB::commit();
    return response()->json([
        'message' => 'EZ Funnel updated successfully',
        'funnel' => $ezFunnel->fresh()->load(['fields' => function ($query) { $query->orderBy('position', 'asc'); }])
    ]);
	}

	public function previewez()
    {
		$template = Frontpage::where('frontpages.id', 1)
            ->join('templates', 'frontpages.theme_id', '=', 'templates.id')
            ->select('templates.*')
            ->first();
		
        return Inertia::render('previewez', [
            'template' => $template,
            'auth' => [
                'user' => auth()->user() ?? null
            ]
        ]);
    }
	
	public function ezui()
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
    return Inertia::render('ezui', [
        'template' => $template,
        'auth' => [
            'user' => auth()->user() ?? null
        ],
        'initialFunnels' => $funnels
    ]);
	}
	
	public function edit($id)
	{
		$funnel = EzFunnel::with(['effectSettings', 'fields'])
			->where('id', $id)
			->where('user_id', auth()->id())
			->firstOrFail();

		return response()->json([
			'id' => $funnel->id,
			'token' => $funnel->token,
			'fly_sign' => $funnel->fly_sign,
			'eye_tracking' => $funnel->eye_tracking,
			'theme' => $funnel->theme,
			'mode' => $funnel->mode,
			'effect_settings' => $funnel->effectSettings,
			'fields' => $funnel->fields,
			'custom_domains' => $funnel->customDomains,
			'handle_domains' => $funnel->handleDomains
		]);
	}
	
	public function updateezui(Request $request)
{
    $request->validate([
        'id' => 'required|exists:ez_funnels,id',
        'flySign' => 'required|boolean',
        'eyeTracking' => 'required|boolean',
    ]);

    $funnel = EzFunnel::where('id', $request->id)
        ->where('user_id', auth()->id())
        ->firstOrFail();

    // Update main funnel data
    $funnel->update([
        'fly_sign' => $request->flySign,
        'eye_tracking' => $request->eyeTracking,
    ]);

    // Update or create effect settings (optional)
    if ($request->effectSettings) {
        // First delete existing effect settings not in the request
        $existingIds = collect($request->effectSettings)
            ->filter(fn($effect) => isset($effect['id']))
            ->pluck('id')
            ->toArray();
            
        $funnel->effectSettings()
            ->whereNotIn('id', $existingIds)
            ->delete();

        foreach ($request->effectSettings as $effectData) {
            $funnel->effectSettings()->updateOrCreate(
                ['id' => $effectData['id'] ?? null],
                [
                    'moving_effect' => $effectData['movingEffect'] ?? null,
                    'moving_pattern' => $effectData['movingPattern'] ?? null,
                    'brand_message' => $effectData['brandMessage'] ?? null,
                    'avatar_link' => $effectData['avatarLink'] ?? null,
                    'landing_page' => $effectData['landingPage'] ?? null
                ]
            );
        }
    }

    return response()->json([
        'message' => 'Funnel updated successfully',
        'funnel' => $funnel->load('effectSettings')
    ]);
}

public function updateezuitheme(Request $request)
{
    $request->validate([
        'id' => 'required|exists:ez_funnels,id',
        'theme' => 'nullable|string|max:255',
        'mode' => 'nullable|string|max:255',
    ]);

    $funnel = EzFunnel::where('id', $request->id)
        ->where('user_id', auth()->id())
        ->firstOrFail();

    // Update only theme and mode
    $updateData = [];
    if ($request->has('theme')) {
        $updateData['theme'] = $request->theme;
    }
    if ($request->has('mode')) {
        $updateData['mode'] = $request->mode;
    }

    $funnel->update($updateData);

    return response()->json([
        'message' => 'Theme updated successfully',
        'funnel' => $funnel->fresh()
    ]);
}

public function ezseo()
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
    return Inertia::render('ezseo', [
        'template' => $template,
        'auth' => [
            'user' => auth()->user() ?? null
        ],
        'initialFunnels' => $funnels
    ]);
	}
	
	public function getSeo($id)
{
    $funnel = EzFunnel::where('id', $id)
        ->where('user_id', auth()->id())
        ->firstOrFail();

    if ($funnel->seoSettings) {
        return response()->json($funnel->seoSettings);
    }

    return response()->json([
        'meta_title' => '',
        'meta_keywords' => '',
        'meta_description' => '',
        'meta_logo' => '',
        'meta_site_name' => '',
        'meta_site_url' => 'https://ez.wiki/' . $funnel->token
    ]);
}

	public function updateSeo(Request $request)
{
    $request->validate([
        'funnelId' => 'required|exists:ez_funnels,id',
    ]);

    $funnel = EzFunnel::where('id', $request->funnelId)
        ->where('user_id', auth()->id())
        ->firstOrFail();

    $seoData = [
        'meta_title' => $request->metaTitle,
        'meta_keywords' => $request->metaKeywords,
        'meta_description' => $request->metaDescription,
        'meta_logo' => $request->metaLogo,
        'meta_site_name' => $request->metaSiteName,
        'meta_site_url' => $request->metaSiteUrl
    ];

    if ($funnel->seoSettings) {
        $funnel->seoSettings()->update($seoData);
    } else {
        $funnel->seoSettings()->create($seoData);
    }

    return response()->json([
        'message' => 'SEO settings updated successfully',
        'seo' => $funnel->seoSettings()->first()
    ]);
}

public function ezlogo()
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
    return Inertia::render('ezlogo', [
        'template' => $template,
        'auth' => [
            'user' => auth()->user() ?? null
        ],
        'initialFunnels' => $funnels
    ]);
	}
	
	public function getFunnelLogo($id)
	{
		$funnel = EzFunnel::where('id', $id)
			->where('user_id', auth()->id())
			->firstOrFail();

		return response()->json($funnel->logoSettings ?? [
			'fly_sign_logo' => '',
			'favicon_logo' => '',
			'meta_logo' => '',
			'secondary_logo' => ''
		]);
	}
	
	public function updateFunnelLogo(Request $request)
{
    $request->validate([
        'funnelId' => 'required|exists:ez_funnels,id',
    ]);

    $funnel = EzFunnel::where('id', $request->funnelId)
        ->where('user_id', auth()->id())
        ->firstOrFail();

    $logoPath = null;
    if ($request->hasFile('logoImage')) {
        // Delete old logo if it exists
        if ($funnel->logoSettings && $funnel->logoSettings->logoimage) {
            $oldImagePath = public_path($funnel->logoSettings->logoimage);
            if (file_exists($oldImagePath)) {
                unlink($oldImagePath);
            }
        }

        $image = $request->file('logoImage');
        $imageName = time() . '_.' . $image->getClientOriginalExtension();
        $destinationPath = public_path('logoimage');
        
        if (!file_exists($destinationPath)) {
            mkdir($destinationPath, 0755, true);
        }
        
        $image->move($destinationPath, $imageName);
        $logoPath = 'logoimage/' . $imageName;
    } else {
        $logoPath = $request->url;
    }

    $logoData = [
        'logoimage' => $logoPath,
        'fly_sign_logo' => $request->flySign,
        'favicon_logo' => $request->favicon,
        'meta_logo' => $request->metaLogo,
        'secondary_logo' => $request->secondaryLogo
    ];

    // Filter out null values to prevent overwriting existing logos with null
    $logoData = array_filter($logoData, function($value) {
        return $value !== null;
    });

    // Update or create logo settings through the relationship
    if ($funnel->logoSettings) {
        $funnel->logoSettings()->update($logoData);
    } else {
        $funnel->logoSettings()->create($logoData);
    }

    return response()->json([
        'message' => 'Logo settings updated successfully',
        'logo' => $funnel->logoSettings()->first()
    ]);
}

public function ezhashtag()
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
    return Inertia::render('ezhashtag', [
        'template' => $template,
        'auth' => [
            'user' => auth()->user() ?? null
        ],
        'initialFunnels' => $funnels
    ]);
	}
	
	public function updateHandleDomainHashtag(Request $request, $domainId)
{
    $request->validate([
        'hashtag' => 'nullable|string|max:255'
    ]);

    $domain = Domain::where('id', $domainId)
    ->whereHas('funnel', function($query) {
        $query->where('user_id', auth()->id());
    })
    ->firstOrFail();

    $domain->update(['hashtag' => $request->hashtag]);

    return response()->json([
        'message' => 'Handle domain hashtag updated successfully',
        'domain' => $domain
    ]);
}

public function updateCustomDomainHashtag(Request $request, $domainId)
{
    $request->validate([
        'hashtag' => 'nullable|string|max:255'
    ]);

    $domain = Customdomain::where('id', $domainId)
        ->whereHas('funnel', function($query) {
            $query->where('user_id', auth()->id());
        })
        ->firstOrFail();

    $domain->update(['hashtag' => $request->hashtag]);

    return response()->json([
        'message' => 'Custom domain hashtag updated successfully',
        'domain' => $domain
    ]);
}
	
	public function updateSeoTag(Request $request, $funnelId)
{
    $request->validate([
        'seo_tag' => 'nullable|string|max:255'
    ]);

    $funnel = EzFunnel::where('id', $funnelId)
        ->where('user_id', auth()->id())
        ->firstOrFail();

    $funnel->update(['seo_tag' => $request->seo_tag]);

    return response()->json([
        'message' => 'SEO tag updated successfully',
        'funnel' => $funnel
    ]);
}

public function preview(Request $request, $id = null)
{
    $previewData = [];
    
    if ($request->session()->has('ezFunnelPreview')) {
        $previewData = json_decode($request->session()->get('ezFunnelPreview'), true);
    }
	$eyeTracking = $previewData['formData']['eyeTracking'] ? '1' : '0';
    $fly_sign = $previewData['formData']['flySign'] ? '1' : '0';
    $mode = 'L';
	$themeIds = $previewData['formData']['theme'];
	
    // Get all templates in the same order as themeIds
    $templates = collect();
    foreach ($themeIds as $themeId) {
        $template = Template::where('id', $themeId)->first();
        if ($template) {
            $templates->push($template);
        }
    }
	
	if($id!='')
	{
	$funnelData = EzFunnel::select('ez_funnels.*', 'ez_funnel_fields.*')
        ->join('ez_funnel_fields', 'ez_funnels.id', '=', 'ez_funnel_fields.ez_funnel_id')
        ->where('ez_funnels.id', $id)
        ->get();
        
    $funnel = $funnelData->first();
	$effect = EffectSetting::where('ez_funnel_id', $funnel->ez_funnel_id)->get();
	$effect = $effect->isEmpty() ? null : $effect;
	$funnelid = $funnel->token;
	}else
	{
	$effect = null;
	$funnelid = 'preview';
	}
    $agent = new Agent();
    $sidebarwidth = 1;
	$setting = Setting::where('id', 1)->first();
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
			return '<img src="'.$image.'"  alt="Productivity App Interface" style="display:block;width:100%" >';
			}else
			{
				return '<img src="/bee.webp"  alt="Productivity App Interface" style="display:block;width:100%" >';
			}
		}
		function printfav(?string $image)
		{
			if ($image) {
			   return '<img src="'.$image.'" alt="Profile Picture" style="width:44px;height:44px;border-radius:50%;border:2px solid rgba(0,212,255,0.5);object-fit:cover;flex-shrink:0" >';
			}
			return null;
		}
		
		function random_color_part() {
		 return str_pad( dechex( mt_rand( 0, 255 ) ), 2, '0', STR_PAD_LEFT);
		}

		function random_color() {
		 return random_color_part() . random_color_part() . random_color_part();
		}
	$contents = collect($previewData['dynamicForms'])->map(function($item) use (&$sidebarwidth, $agent) {
    // Determine width based on emojiMarker (note the camelCase)
    $width = '30'; // default for emojis like 🔐,3️⃣,🚀,🧨
    switch ($item['emojiMarker']) {
        case '1️⃣':
            $width = '97';
            break;
        case '2️⃣':
            $width = '47';
            break;
        case '*️⃣':
            $width = '63';
            break;
        case '0️⃣':
            // Skip this item entirely
            return null;
    }
    
    if ($agent->isMobile() || $agent->isTablet()) {
        $width = '90';
    }
    
    if($sidebarwidth == 1 && $width != 97) {
        $sidebarwidth = 93 - $width;
    }
    
    // Only return items that aren't marked with 0️⃣
	$aladinurlredirectembed='';
			$type='';
			$done='';
			if(isset($item['url'])){
			$parse = explode('/',$item['url']);
			$fullDomain = idn_to_utf8(get_domain($item['url']));
			$domains = Admindomain::where('domain', $fullDomain)->first();
			if(!empty($domains)){
				if (filter_var($item['url'], FILTER_VALIDATE_URL)) {
				$aladinurlredirectembed.='<iframe src="'.$item['url'].'" height="888" width="100%" frameborder="0" scrolling="yes" allowfullscreen="true"></iframe>';
				$done='done';		
				}
			}
			if(isset($parse[3])){
			$linkdomain=$parse[0].'//'.$parse[2].'/';
			$search=$parse[3];
			$urlnew=$item['url'];
			
			if('tiktok.com'==get_domain($item['url']) || 'www.tiktok.com'==get_domain($item['url'])){
				$aladinurlredirectembed.='<blockquote class="tiktok-embed" cite="'.$item['url'].'" data-unique-id="melonnt" data-embed-type="creator" style="max-width: 780px; min-width: 288px;" > <section> <a target="_blank" href="'.$item['url'].'?refer=creator_embed">'.$search.'</a> </section> </blockquote> <script async src="https://www.tiktok.com/embed.js"></script>';
				$done='done';
					
				}
			elseif($linkdomain=='https://kick.com/'){
				$aladinurlredirectembed.='<iframe src="https://player.kick.com/'.$search.'" height="888" width="100%" frameborder="0" scrolling="yes" allowfullscreen="true"></iframe>';
				$done='done';
					
				}elseif($linkdomain=='https://live.arrival.space/'){
				$aladinurlredirectembed.='<iframe src="https://live.arrival.space/'.$search.'" height="888" width="100%" frameborder="0" scrolling="yes" allowfullscreen="true"></iframe>';
				$done='done';
					
				}elseif('reddit.com'==get_domain($item['url']) || 'www.reddit.com'==get_domain($item['url'])){	
				$aladinurlredirectembed.='<blockquote class="reddit-embed-bq" style="height:500px" data-embed-height="740"><a href="'.$item['url'].'"></a></blockquote><script async="" src="https://embed.reddit.com/widgets.js" charset="UTF-8"></script>';
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
		curl_setopt($curl, CURLOPT_TIMEOUT, 15); // 15 second timeout for entire request
		curl_setopt($curl, CURLOPT_CONNECTTIMEOUT, 10); // 10 second timeout for connection
		curl_setopt($curl, CURLOPT_FOLLOWLOCATION, true); // Allow redirects
		$html = curl_exec($curl);
		$htmlnotsupport=$html;
		if($html!=false){
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
			
			if (!filter_var($item['url'], FILTER_VALIDATE_URL))
				{
					$aladinurlredirectembed.=$item['url'];
				}else
				{
				$urlparse = $item['url'];
				$parsed_url = parse_url($urlparse);
				if (isset($parsed_url['host'])) {
					$domain = $parsed_url['host'];
				} else {
					$domain = '';
				}
				$punycodeDomain = idn_to_ascii($domain); 
				$pndomain=str_replace($domain, $punycodeDomain, $item['url']);
					preg_match('%(?:youtube(?:-nocookie)?\.com/(?:[^/]+/.+/|(?:v|e(?:mbed)?)/|.*[?&]v=)|youtu\.be/)([^"&?/ ]{11})%i', $pndomain, $match);
					if(!empty($match))
					{
					$type='done';
					$aladinurlredirectembed.='<iframe loading="lazy" height="888px" src="https://www.youtube.com/embed/'.$match[1].'?controls=0&showinfo=0&rel=0" frameborder="0" allowfullscreen></iframe>';
					}
					preg_match('%^https?:\/\/(?:www\.|player\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)(?:[?]?.*)$%im', $pndomain, $match);
					if(!empty($match))
					{
					$type='done';
					$aladinurlredirectembed.='<iframe loading="lazy" allow="camera; microphone; fullscreen; display-capture; autoplay" src="https://player.vimeo.com/video/'.$match[3].'?h=33160d1512&color=de0101" width="100%" height="888px" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>';
					}
					preg_match('/^(https?:\/\/)?(www\.)?fb.watch\/[a-zA-Z0-9(\.\?)?]/', $pndomain, $match);
					if(!empty($match))
					{
					$type='done';
					$aladinurlredirectembed.='<div class="fb-video" data-href="'.$pndomain.'" data-width="500" data-show-text="true"></div>';
					}
					preg_match('/^(https?:\/\/)?(www\.)?facebook.com\/[a-zA-Z0-9(\.\?)?]/', $pndomain, $match);
					if(!empty($match))
					{
					if (strpos($pndomain,'groups') == false) {
							$type='done';
							$aladinurlredirectembed.='<div class="fb-post" data-href="'.$pndomain.'" data-width="500" data-show-text="true"></div>';
						}else
						{
						$str = ['{backimage}','{backcolor}','{favicon}','{providerName}','{loadingurl}','{image}','{title}','{description}'];
						$type='done';
						$curl = curl_init('https://api.microlink.io/?url='.$pndomain);
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
								$fav='<img src="'.$logo.'" alt="Profile Picture" style="width:44px;height:44px;border-radius:50%;border:2px solid rgba(0,212,255,0.5);object-fit:cover;flex-shrink:0" >';
								$rplc =['','',$fav,$publisher,$urlpage,printImage($image),printText($title),printText($description)];
								$code = Page::where('id',1)->value('code');
								$divstr=str_replace($str,$rplc,$code);
								$aladinurlredirectembed.=$divstr;
						}
					}
					preg_match('/^(https?:\/\/)?(www\.)?twitter.com\/[a-zA-Z0-9(\.\?)?]/', $pndomain, $match);
					if(!empty($match))
					{
					$type='done';
					$aladinurlredirectembed.='<blockquote class="twitter-tweet"><p lang="zxx" dir="ltr"><a href="'.$pndomain.'">'.$pndomain.'</a></p>&mdash; News (@XNews) <a href="'.$pndomain.'?ref_src=twsrc%5Etfw"></a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>';
					}
					preg_match('/^(https?:\/\/)?(www\.)?x.com\/[a-zA-Z0-9(\.\?)?]/', $pndomain, $match);
					if(!empty($match))
					{
					$type='done';
					$aladinurlredirectembed.='<blockquote class="twitter-tweet"><p lang="zxx" dir="ltr"><a href="'.$pndomain.'">'.$pndomain.'</a></p>&mdash; News (@XNews) <a href="'.$pndomain.'?ref_src=twsrc%5Etfw"></a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>';
					}
					if($type!='done')
					{
						if (filter_var($pndomain, FILTER_VALIDATE_URL)) {
							$isFriendly = IframeHelper::isIframeable($pndomain);
							if ($isFriendly) {
								$type='iframe';
							}else{
								$type='div';
							}
						} else {
							$type='text';
						}
						if($type=='text')
						{
							$aladinurlredirectembed.=$pndomain; 
						}
						if($type=='iframe')
						{
							$pattern = '/<iframe/i';
							preg_match($pattern, $pndomain, $match);
							if(!empty($match)) {
								$aladinurlredirectembed.=$pndomain;
							} else {
								$aladinurlredirectembed.='<iframe loading="lazy" allow="camera; microphone; fullscreen; display-capture; autoplay" style="border: 0;" src="'.$pndomain.'" width="100%" height="888px" allowfullscreen="allowfullscreen" ></iframe>';
							}
						}else{
						
							if($type!='text')
								{
								$scrapingurl=json_decode($setting['scrapingurl']);
								$scrp='OFF';
								for ($k = 0; $k < count($scrapingurl); $k++) { 
								if(get_domain($pndomain)==get_domain($scrapingurl[$k]))
								{
								$scrp='ON';
								}
								}
								
								if($scrp=='ON')
								{
								$curl = curl_init($pndomain);
								curl_setopt($curl, CURLOPT_RETURNTRANSFER, TRUE);
								curl_setopt($curl,CURLOPT_USERAGENT,'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.13) Gecko/20080311 Firefox/2.0.0.13');
								$page = curl_exec($curl);
								$page1 = str_replace('<button aria-label="Share" data-testid="ShareButton" style="transition:background-color 150ms ease" class="sc-pFZIQ sc-aemoO fRlsIx cBGtLF"><svg width="16" height="16" viewBox="0 0 16 16" enable-background="new 0 0 24 24" class="sc-gKsewC iPWGYb"><path fill-rule="evenodd" clip-rule="evenodd" d="M10.6464 3.85347L11 4.20702L11.7071 3.49992L11.3536 3.14636L8.35355 0.146362H7.64645L4.64645 3.14636L4.29289 3.49992L5 4.20702L5.35355 3.85347L7.5 1.70702V9.49992V9.99992H8.5V9.49992V1.70702L10.6464 3.85347ZM1 5.49994L1.5 4.99994H4V5.99994H2V14.9999H14V5.99994H12V4.99994H14.5L15 5.49994V15.4999L14.5 15.9999H1.5L1 15.4999V5.49994Z" fill="currentColor"></path></svg></button>',"",$page);
								$page2 = preg_replace('#<a href="/" class="sc-bdfBwQ Tmnro">(.*?)</a>#', '', $page1);
								$page3 = str_replace('<button id="ot-sdk-btn" class="ot-sdk-show-settings">Cookie Preferences</button>',"",$page2);
								$page4 = str_replace('https://linktr.ee',"https://4x4.ai",$page3);
								if(parse_url($pndomain, PHP_URL_HOST)=='lnk.bio')
								{
								$page4 = str_replace('href="/','href="https://lnk.bio/',$page4);
								$page4 = str_replace('src="/','src="https://lnk.bio/',$page4);
								$page4 = str_replace('https://lnk.bio//cdn.',"//cdn.",$page4);
								}
								$content = $page4.'<style>.dTcluo{ height:auto;}</style><script>$("#pb_cookie_consent").hide(); </script>';
								$time=time();


								$fp = fopen($_SERVER['DOCUMENT_ROOT'] . "/temp/".$time."temp.html","wb");
								fwrite($fp,$content);
								fclose($fp);
								$aladinurlredirectembed.='<iframe loading="lazy" allow="camera; microphone; fullscreen; display-capture; autoplay" style="border: 0;" src="temp/'.$time.'temp.html" width="100%" height="888px" allowfullscreen="allowfullscreen" ></iframe>';
								} else
								{
								if($htmlnotsupport!='false')
								{
								try {

								$embeded = new Embed();
								$info = $embeded->get($pndomain);
								$str = ['{backimage}','{backcolor}','{favicon}','{providerName}','{loadingurl}','{image}','{title}','{description}'];
								
								if(file_exists(printfav($info->favicon)))
								{
								$fav=printfav($info->favicon);	
								$rplc =['','',$fav,printText($info->providerName),$pndomain,printImage($info->image),printText($info->title),printText($info->description)];
								}else
								{
								$curl = curl_init('https://api.microlink.io/?url='.$pndomain);
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
								$fav='<img src="'.$logo.'" alt="Profile Picture" style="width:44px;height:44px;border-radius:50%;border:2px solid rgba(0,212,255,0.5);object-fit:cover;flex-shrink:0" >';
								$rplc =['','',$fav,$publisher,$urlpage,printImage($image),printText($title),printText($description)];
								}
								
								$code = Page::where('id',1)->value('code');
								$divstr=str_replace($str,$rplc,$code);
								$aladinurlredirectembed.=$divstr;
								} catch (Exception $e) {
									$aladinurlredirectembed.=$e->getMessage();
								}
								}else
								{
									$aladinurlredirectembed.='Unsupported domain.'.$pndomain;
								}
								}
								
								}	
						}
					}

				}
				
		}
			
			}
			
    if ($item['emojiMarker'] !== '0️⃣') {
        return [
            'id' => $item['id'],
            'title' => $item['caption'] ?? '',
            'url' => $aladinurlredirectembed,
            'width' => $width.'%'
        ];
    }
    
    return null;
	})->filter()->values()->all();
	$count = count($contents);
	$metaTitle = 'Ez way to WiKi and CoWiKi';
    $metaDescription = 'Ez way to WiKi and CoWiKi';
    $metaKeywords = '';
    $metaSiteUrl = url()->current();
    $metaSiteName = 'ez.wiki';
    $metaLogo = 'https://ez.wiki/logo.gif';
    $favicon = 'https://ez.wiki/logo.gif';
	return Inertia::render('preview', [
        'contents' => $contents,
        'template' => $templates->first(), // For backward compatibility
        'allTemplates' => $templates,      // Send all templates for slider
        'funnel' => $funnelid,
        'eye_tracking' => $eyeTracking,
        'fly_sign' => $fly_sign,
        'mode' => $mode,
        'count' => $count,
        'sidebarwidth' => $sidebarwidth.'%',
        'effect' => $effect,
        'auth' => [
            'user' => auth()->user()
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

public function storePreviewData(Request $request)
{
    $request->session()->put('ezFunnelPreview', json_encode($request->input('previewData')));
    return response()->json(['success' => true]);
}

public function generatebioexcreate(Request $request)
    {
        $color=0;
        $url = $request->url;
        $urlex=explode('/',$request->url);
        $linktreelink='';
        $type='';
        session()->put('linkname', '');
        $setting = Setting::where('id', 1)->first();
        $url = urldecode($url);
        $linktreelink='';
        $arrayfields = [];
        
        function random_color_part() {
            return str_pad(dechex(mt_rand(0, 255)), 2, '0', STR_PAD_LEFT);
        }

        function random_color() {
            return random_color_part() . random_color_part() . random_color_part();
        }
        
        if($urlex[2]=='kick.com') {
            $linktreelink.='<iframe src="https://player.kick.com/'.$urlex[3].'" height="888" width="100%" frameborder="0" scrolling="yes" allowfullscreen="true"></iframe>';
        } elseif($urlex[2]=='live.arrival.space') {
            $linktreelink.='<iframe src="https://live.arrival.space/'.$urlex[3].'" height="888" width="100%" frameborder="0" scrolling="yes" allowfullscreen="true"></iframe>';
        } elseif($urlex[2]=='twitter.com') {
            $linktreelink.='<a class="twitter-timeline" href="https://twitter.com/'.$urlex[3].'?ref_src=twsrc%5Etfw">Tweets by JaredFPS</a><script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>';
        } elseif($urlex[2]=='pinterest.com') {
            $linktreelink.='<a data-pin-do="embedUser" data-pin-board-width="1024" data-pin-scale-height="888" data-pin-scale-width="80" href="https://www.pinterest.com/'.$request->search.'/">Follow '.$urlex[3].' on Pinterest</a><script async defer src="//assets.pinterest.com/js/pinit.js"></script>';
        } else {
            $curl = curl_init($url);
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
            
            $linktreelink='';
            
            function isCSS($text) {
                $pattern = '/\.[a-zA-Z0-9_-]+{[^}]*}/';
                if (preg_match($pattern, $text)) {
                    return false;
                }
                return true;
            }
            
            if($urlex[2]=='lnk.bio') {
                if(!empty($links)) {
                    $linktreelink.='<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Profile Links</title><style>.mainbio { font-family: \'Arial\', sans-serif; background-color: #283845; color: #fff; display: flex; justify-content: center; align-items: center; margin: 0; } .containerbio { background-color: #1c2833; border-radius: 15px; padding: 25px; text-align: center; width: 350px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2); margin: 30px 0; transition: transform 0.3s ease; } .containerbio:hover { transform: translateY(-5px); } .profilebio img { width: 120px; height: 120px; border-radius: 50%; margin-bottom: 15px; border: 3px solid #fff; } .profilebio p { font-size: 14px; margin-bottom: 25px; color: #ddd; } .linksbio a, footer a { border: none; color: white; padding: 12px 20px; text-align: center; text-decoration: none; display: block; margin: 10px 0; cursor: pointer; border-radius: 50px; transition: background-color 0.3s ease, transform 0.3s ease; font-size: 16px; font-weight: bold; }.linksbio a:hover { transform: translateY(-3px); filter: brightness(1.1); } footer a { background-color: #e67e22; margin-top: 25px; } footer a:hover { background-color: #d35400; }</style></head><body><div class="mainbio" ><div class="containerbio"><div class="profilebio">';
                    
                    if(!empty($img)) { 
                        $linktreelink.='<img src="'.$img[0]['src'].'" alt="Profile Image">';
                    } 
                    
                    $linktreelink.='<p>'.$links[10]['text'].'</p></div><div class="linksbio">';
                    $done='';
                    
                    foreach ($links as $link) {
                        if($link['title']=='Get Lnk.Bio') {
                            $done='done';
                        }
                        if($link['title']!='' && $done=='' && $link['text']!='Lnk.Bio') { 
                            $linktreelink.='<a href="'.$link['href'].'" style="background-color: #'.random_color().';" target="_blank" >'.$link['text'].'</a>';        
                        }
                    } 
                    $linktreelink.='</div></div></div></body></html>';
                }
            } elseif($urlex[2]=='campsite.bio') {
                if(!empty($links)) {
                    $linktreelink.='<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Profile Links</title><style>.mainbio { font-family: \'Arial\', sans-serif; background-color: #283845; color: #fff; display: flex; justify-content: center; align-items: center; margin: 0; } .containerbio { background-color: #1c2833; border-radius: 15px; padding: 25px; text-align: center; width: 350px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2); margin: 30px 0; transition: transform 0.3s ease; } .containerbio:hover { transform: translateY(-5px); } .profilebio img { width: 120px; height: 120px; border-radius: 50%; margin-bottom: 15px; border: 3px solid #fff; } .profilebio p { font-size: 14px; margin-bottom: 25px; color: #ddd; } .linksbio a, footer a { border: none; color: white; padding: 12px 20px; text-align: center; text-decoration: none; display: block; margin: 10px 0; cursor: pointer; border-radius: 50px; transition: background-color 0.3s ease, transform 0.3s ease; font-size: 16px; font-weight: bold; }.linksbio a:hover { transform: translateY(-3px); filter: brightness(1.1); } footer a { background-color: #e67e22; margin-top: 25px; } footer a:hover { background-color: #d35400; }</style></head><body><div class="mainbio" ><div class="containerbio"><div class="profilebio">';
                    
                    if(!empty($img)) {
                        $linktreelink.='<img src="'.$img[0]['src'].'" alt="Profile Image">';
                    } 
                    
                    $linktreelink.='<p>';
                    if(!empty($texth1)) { 
                        $linktreelink.=$texth1[0]['text']; 
                    } 
                    $linktreelink.='</p><p>';
                    if(!empty($textp)) { 
                        $linktreelink.=$textp[0]['text']; 
                    } 
                    $linktreelink.='</p></div><div class="linksbio">';
                    
                    foreach ($links as $link) {
                        if($link['text']!='') { 
                            if(preg_match('/^(http|https):\\/\\/[a-z0-9]+([\\-\\.]{1}[a-z0-9]+)*\\.[a-z]{2,5}'.'((:[0-9]{1,5})?\\/.*)?$/i', $link['href'] . PHP_EOL)) {
                                $linktreelink.='<a href="'.$link['href'].'" style="background-color: #'.random_color().';" target="_blank" >'.$link['text'].'</a>';        
                            }
                        }
                    }
                    $linktreelink.='</div></div></div></body></html>';
                }
            } elseif($urlex[2]=='bio.site') {
                if(!empty($links)) {
                    $linktreelink.='<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Profile Links</title><style>.mainbio { font-family: \'Arial\', sans-serif; background-color: #283845; color: #fff; display: flex; justify-content: center; align-items: center; margin: 0; } .containerbio { background-color: #1c2833; border-radius: 15px; padding: 25px; text-align: center; width: 350px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2); margin: 30px 0; transition: transform 0.3s ease; } .containerbio:hover { transform: translateY(-5px); } .profilebio img { width: 120px; height: 120px; border-radius: 50%; margin-bottom: 15px; border: 3px solid #fff; } .profilebio p { font-size: 14px; margin-bottom: 25px; color: #ddd; } .linksbio a, footer a { border: none; color: white; padding: 12px 20px; text-align: center; text-decoration: none; display: block; margin: 10px 0; cursor: pointer; border-radius: 50px; transition: background-color 0.3s ease, transform 0.3s ease; font-size: 16px; font-weight: bold; }.linksbio a:hover { transform: translateY(-3px); filter: brightness(1.1); } footer a { background-color: #e67e22; margin-top: 25px; } footer a:hover { background-color: #d35400; }</style></head><body><div class="mainbio" ><div class="containerbio"><div class="profilebio">';
                    
                    if(!empty($img)) { 
                        $image=''; 
                        foreach ($img as $imgs) { 
                            if(@getimagesize($imgs['src']) && $image!='done') { 
                                $image='done';
                                $linktreelink.='<img src="'.$imgs['src'].'" alt="Profile Image">';
                            }
                        }
                    } 
                    
                    $linktreelink.='<p>';
                    if(!empty($texth1)) { 
                        $linktreelink.=$texth1[0]['text']; 
                    } 
                    $linktreelink.='</p><p>';
                    if(!empty($textp)) { 
                        $linktreelink.=$textp[0]['text']; 
                    } 
                    $linktreelink.='</p></div><div class="linksbio">';
                    
                    foreach ($links as $link) {
                        if($link['text']!='' && $link['text']!='Create a free Bio Site') { 
                            if(preg_match('/^(http|https):\\/\\/[a-z0-9]+([\\-\\.]{1}[a-z0-9]+)*\\.[a-z]{2,5}'.'((:[0-9]{1,5})?\\/.*)?$/i', $link['href'] . PHP_EOL)) {
                                $linktreelink.='<a href="'.$link['href'].'" style="background-color: #'.random_color().';" target="_blank" >'.$link['text'].'</a>';        
                            } 
                        }
                    }
                    $linktreelink.='</div></div></div></body></html>';
                }
            } elseif($urlex[2]=='hoo.be') {
                if(!empty($links)) {
                    $linktreelink.='<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Profile Links</title><style>.mainbio { font-family: \'Arial\', sans-serif; background-color: #283845; color: #fff; display: flex; justify-content: center; align-items: center; margin: 0; } .containerbio { background-color: #1c2833; border-radius: 15px; padding: 25px; text-align: center; width: 350px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2); margin: 30px 0; transition: transform 0.3s ease; } .containerbio:hover { transform: translateY(-5px); } .profilebio img { width: 120px; height: 120px; border-radius: 50%; margin-bottom: 15px; border: 3px solid #fff; } .profilebio p { font-size: 14px; margin-bottom: 25px; color: #ddd; } .linksbio a, footer a { border: none; color: white; padding: 12px 20px; text-align: center; text-decoration: none; display: block; margin: 10px 0; cursor: pointer; border-radius: 50px; transition: background-color 0.3s ease, transform 0.3s ease; font-size: 16px; font-weight: bold; }.linksbio a:hover { transform: translateY(-3px); filter: brightness(1.1); } footer a { background-color: #e67e22; margin-top: 25px; } footer a:hover { background-color: #d35400; }</style></head><body><div class="mainbio" ><div class="containerbio"><div class="profilebio">';
                    
                    if(!empty($img)) {
                        $linktreelink.='<img src="https://hoo.be/'.$img[1]['src'].'" alt="Profile Image">';
                    } 
                    
                    $linktreelink.='<p>';
                    if(!empty($textspan)) { 
                        $linktreelink.=$textspan[0]['text']; 
                    } 
                    $linktreelink.='</p><p>';
                    if(!empty($texth5)) { 
                        $linktreelink.=$texth5[0]['text']; 
                    } 
                    $linktreelink.='</p></div><div class="linksbio">';
                    
                    foreach ($links as $link) {
                        if($link['text']!='' && strtolower($link['text'])!=strtolower('FacebookFacebook') && strtolower($link['text'])!=strtolower('InstagramInstagram') && strtolower($link['text'])!=strtolower('YouTubeYouTube') && strtolower($link['text'])!=strtolower('EmailEmail') && strtolower($link['text'])!=strtolower('XX') && strtolower($link['text'])!=strtolower('Share on Twitter') && strtolower($link['text'])!=strtolower('Share on Facebook') && isCSS($link['text'])) { 
                            if(preg_match('/^(http|https):\\/\\/[a-z0-9]+([\\-\\.]{1}[a-z0-9]+)*\\.[a-z]{2,5}'.'((:[0-9]{1,5})?\\/.*)?$/i', $link['href'] . PHP_EOL)) {
                                $linktreelink.='<a href="'.$link['href'].'" style="background-color: #'.random_color().';" target="_blank" >'.$link['text'].'</a>';        
                            }
                        }
                    }
                    $linktreelink.='</div></div></div></body></html>';
                }
            } elseif($urlex[2]=='linktr.ee') {
                if(!empty($links)) {
                    $linktreelink.='<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Profile Links</title><style>.mainbio { font-family: \'Arial\', sans-serif; background-color: #283845; color: #fff; display: flex; justify-content: center; align-items: center; margin: 0; } .containerbio { background-color: #1c2833; border-radius: 15px; padding: 25px; text-align: center; width: 350px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2); margin: 30px 0; transition: transform 0.3s ease; } .containerbio:hover { transform: translateY(-5px); } .profilebio img { width: 120px; height: 120px; border-radius: 50%; margin-bottom: 15px; border: 3px solid #fff; } .profilebio p { font-size: 14px; margin-bottom: 25px; color: #ddd; } .linksbio a, footer a { border: none; color: white; padding: 12px 20px; text-align: center; text-decoration: none; display: block; margin: 10px 0; cursor: pointer; border-radius: 50px; transition: background-color 0.3s ease, transform 0.3s ease; font-size: 16px; font-weight: bold; }.linksbio a:hover { transform: translateY(-3px); filter: brightness(1.1); } footer a { background-color: #e67e22; margin-top: 25px; } footer a:hover { background-color: #d35400; }</style></head><body><div class="mainbio" ><div class="containerbio"><div class="profilebio">';
                    
                    if(!empty($img)) { 
                        $image=''; 
                        foreach ($img as $imgs) { 
                            if(@getimagesize($imgs['src']) && $image!='done') { 
                                $image='done';
                                $linktreelink.='<img src="'.$imgs['src'].'" alt="Profile Image">';
                            }
                        }
                    } 
                    
                    $linktreelink.='<p>';
                    if(!empty($texth1)) { 
                        $texth1done=''; 
                        foreach ($texth1 as $texth1s) { 
                            if(isCSS($texth1s['text']) && $texth1done!='done') { 
                                $texth1done='done'; 
                                $linktreelink.=$texth1s['text']; 
                                session()->put('linkname', trim($texth1s['text'])); 
                            }
                        }
                    } 
                    $linktreelink.='</p></div><div class="linksbio">';
                    
                    foreach ($links as $link) {
                        if($link['text']!='' && strtolower($link['text'])!=strtolower('FacebookFacebook') && strtolower($link['text'])!=strtolower('InstagramInstagram') && strtolower($link['text'])!=strtolower('YouTubeYouTube') && strtolower($link['text'])!=strtolower('EmailEmail') && strtolower($link['text'])!=strtolower('XX') && strtolower($link['text'])!=strtolower('Share on Twitter') && strtolower($link['text'])!=strtolower('Share on Facebook') && isCSS($link['text'])) { 
                            if(preg_match('/^(http|https):\\/\\/[a-z0-9]+([\\-\\.]{1}[a-z0-9]+)*\\.[a-z]{2,5}'.'((:[0-9]{1,5})?\\/.*)?$/i', $link['href'] . PHP_EOL)) {
                                $linktreelink.='<a href="'.$link['href'].'" style="background-color: #'.random_color().';" target="_blank" >'.$link['text'].'</a>';        
                            }
                        }
                    }
                    $linktreelink.='</div></div></div></body></html>';
                }
            } elseif($urlex[2]=='portaly.cc') {
                if(!empty($links)) {
                    $linktreelink.='<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Profile Links</title><style>.mainbio { font-family: \'Arial\', sans-serif; background-color: #283845; color: #fff; display: flex; justify-content: center; align-items: center; margin: 0; } .containerbio { background-color: #1c2833; border-radius: 15px; padding: 25px; text-align: center; width: 350px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2); margin: 30px 0; transition: transform 0.3s ease; } .containerbio:hover { transform: translateY(-5px); } .profilebio img { width: 120px; height: 120px; border-radius: 50%; margin-bottom: 15px; border: 3px solid #fff; } .profilebio p { font-size: 14px; margin-bottom: 25px; color: #ddd; } .linksbio a, footer a { border: none; color: white; padding: 12px 20px; text-align: center; text-decoration: none; display: block; margin: 10px 0; cursor: pointer; border-radius: 50px; transition: background-color 0.3s ease, transform 0.3s ease; font-size: 16px; font-weight: bold; }.linksbio a:hover { transform: translateY(-3px); filter: brightness(1.1); } footer a { background-color: #e67e22; margin-top: 25px; } footer a:hover { background-color: #d35400; }</style></head><body><div class="mainbio" ><div class="containerbio"><div class="profilebio">';
                    
                    if(!empty($img)) { 
                        $image=''; 
                        foreach ($img as $imgs) { 
                            if(@getimagesize($imgs['src']) && $image!='done') { 
                                $image='done';
                                $linktreelink.='<img src="'.$imgs['src'].'" alt="Profile Image">';
                            }
                        }
                    } 
                    
                    $linktreelink.='<p>';
                    if(!empty($texth1)) { 
                        $texth1done=''; 
                        foreach ($texth1 as $texth1s) { 
                            if(isCSS($texth1s['text']) && $texth1done!='done') { 
                                $texth1done='done'; 
                                $linktreelink.=$texth1s['text']; 
                                session()->put('linkname', trim($texth1s['text'])); 
                            }
                        }
                    } 
                    $linktreelink.='</p><p>';
                    if(!empty($textp)) { 
                        $linktreelink.=$textp[0]['text']; 
                    }
                    $linktreelink.='</p></div><div class="linksbio">';
                    
                    foreach ($links as $link) {
                        if($link['text']!='' && strtolower($link['text'])!=strtolower('FacebookFacebook') && strtolower($link['text'])!=strtolower('InstagramInstagram') && strtolower($link['text'])!=strtolower('YouTubeYouTube') && strtolower($link['text'])!=strtolower('EmailEmail') && strtolower($link['text'])!=strtolower('XX') && strtolower($link['text'])!=strtolower('Share on Twitter') && strtolower($link['text'])!=strtolower('Share on Facebook') && isCSS($link['text'])) { 
                            if(preg_match('/^(http|https):\\/\\/[a-z0-9]+([\\-\\.]{1}[a-z0-9]+)*\\.[a-z]{2,5}'.'((:[0-9]{1,5})?\\/.*)?$/i', $link['href'] . PHP_EOL)) {
                                $linktreelink.='<a href="'.$link['href'].'" style="background-color: #'.random_color().';" target="_blank" >'.$link['text'].'</a>';        
                            }
                        }
                    }
                    $linktreelink.='</div></div></div></body></html>';
                }
            } elseif($urlex[2]=='link3.cc') {
                $linktreelink='<iframe loading="lazy" allow="camera; microphone; fullscreen; display-capture; autoplay" style="border: 0;" src="'.$request->linkdomain.$request->search.'" width="100%" height="888px" allowfullscreen="allowfullscreen" ></iframe>';    
            } else {
                $client = new Client([
                    'headers' => [
                        'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
                        'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                        'Accept-Language' => 'en-US,en;q=0.5',
                        'Accept-Encoding' => 'gzip, deflate',
                        'Referer' => 'https://www.google.com/',
                    ],
                ]);
                
                try {
                    $response = $client->get($url);
                    $html = (string) $response->getBody();
                    
                    $crawler = new Crawler($html);
                    $img = $crawler->filter('img')->each(function($node) {
                        $src  = $node->attr('src');
                        return compact('src');
                    });
                    
                    $texth1 = $crawler->filter('h1')->each(function($node) {
                        $text  = $node->text();
                        return compact('text');
                    });
                    
                    $links = $crawler->filter('a')->each(function($node) {
                        $href  = $node->attr('href');
                        $title = $node->attr('title');
                        $text  = $node->text();
                        return compact('href', 'title', 'text');
                    });
                    
                    $color=0;
                    if(!empty($links)) {
                        $content='<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Profile Links</title><style>.mainbio { font-family: \'Arial\', sans-serif; background-color: #283845; color: #fff; display: flex; justify-content: center; align-items: center; margin: 0; } .containerbio { background-color: #1c2833; border-radius: 15px; padding: 25px; text-align: center; width: 350px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2); margin: 30px 0; transition: transform 0.3s ease; } .containerbio:hover { transform: translateY(-5px); } .profilebio img { width: 120px; height: 120px; border-radius: 50%; margin-bottom: 15px; border: 3px solid #fff; } .profilebio p { font-size: 14px; margin-bottom: 25px; color: #ddd; } .linksbio a, footer a { border: none; color: white; padding: 12px 20px; text-align: center; text-decoration: none; display: block; margin: 10px 0; cursor: pointer; border-radius: 50px; transition: background-color 0.3s ease, transform 0.3s ease; font-size: 16px; font-weight: bold; }.linksbio a:hover { transform: translateY(-3px); filter: brightness(1.1); } footer a { background-color: #e67e22; margin-top: 25px; } footer a:hover { background-color: #d35400; }</style></head><body><div class="mainbio" ><div class="containerbio"><div class="profilebio">';
                        
                        if(!empty($img)) { 
                            $image=''; 
                            foreach ($img as $imgs) { 
                                if($imgs['src']!=NULL) { 
                                    if(@getimagesize($imgs['src']) && $image!='done') { 
                                        $image='done'; 
                                        $content.='<img src="'.$imgs['src'].'" alt="Profile Image">';
                                    }
                                }
                            }
                        }
                        
                        $content.='<p>';
                        if(!empty($texth1)) { 
                            $texth1done=''; 
                            foreach ($texth1 as $texth1s) { 
                                if(isCSS($texth1s['text']) && $texth1done!='done') { 
                                    $texth1done='done'; 
                                    $content.=$texth1s['text']; 
                                }
                            }
                        } 
                        $content.='</p></div><div class="linksbio">';
                        
                        foreach ($links as $link) {
                            if($link['text']!='' && strtolower($link['text'])!=strtolower('FacebookFacebook') && strtolower($link['text'])!=strtolower('InstagramInstagram') && strtolower($link['text'])!=strtolower('YouTubeYouTube') && strtolower($link['text'])!=strtolower('EmailEmail') && strtolower($link['text'])!=strtolower('XX') && strtolower($link['text'])!=strtolower('Share on Twitter') && strtolower($link['text'])!=strtolower('Share on Facebook') && isCSS($link['text'])) { 
                                if(preg_match('/^(http|https):\\/\\/[a-z0-9]+([\\-\\.]{1}[a-z0-9]+)*\\.[a-z]{2,5}'.'((:[0-9]{1,5})?\\/.*)?$/i', $link['href'] . PHP_EOL)) {
                                    $content.='<a href="'.$link['href'].'" style="background-color: #'.random_color().';" target="_blank" >'.$link['text'].'</a>';        
                                }
                            }
                        }
                        
                        $content.='</div><footer><a href="https://www.yourpagebuilder.com/">Build Your Page Free</a></footer></div></div></body></html>';
                        
                        $arrayfields[] = [
                            'emoji_marker' => '',
                            'font_size' => '',
                            'caption' => '',
                            'url' => $content,
                            'pinned' => false
                        ];
                        
                        $x=0;
                        foreach ($links as $link) {
                            if($link['text']!='' && strtolower($link['text'])!=strtolower('FacebookFacebook') && strtolower($link['text'])!=strtolower('InstagramInstagram') && strtolower($link['text'])!=strtolower('YouTubeYouTube') && strtolower($link['text'])!=strtolower('EmailEmail') && strtolower($link['text'])!=strtolower('XX') && strtolower($link['text'])!=strtolower('Share on Twitter') && strtolower($link['text'])!=strtolower('Share on Facebook') && isCSS($link['text'])) {
                                if(preg_match('/^(http|https):\\/\\/[a-z0-9]+([\\-\\.]{1}[a-z0-9]+)*\\.[a-z]{2,5}'.'((:[0-9]{1,5})?\\/.*)?$/i', $link['href'] . PHP_EOL)) {
                                    $arrayfields[] = [
                                        'emoji_marker' => '',
                                        'font_size' => '',
                                        'caption' => '',
                                        'url' => str_replace("x.com","twitter.com",$link['href']) . PHP_EOL,
                                        'pinned' => false
                                    ];
                                    $x++; 
                                }
                            }
                        }
                    }
                    return $arrayfields;
                } catch (RequestException $e) {
                    function printText(?string $text) {
                        if ($text) {
                            return htmlspecialchars($text, ENT_IGNORE);
                        }
                    }
                    
                    function printImage(?string $image)
					{
						if ($image) {
						return '<img src="'.$image.'"  alt="Productivity App Interface" style="display:block;width:100%" >';
						}else
						{
							return '<img src="/bee.webp"  alt="Productivity App Interface" style="display:block;width:100%" >';
						}
					}
					function printfav(?string $image)
					{
						if ($image) {
						   return '<img src="'.$image.'" alt="Profile Picture" style="width:44px;height:44px;border-radius:50%;border:2px solid rgba(0,212,255,0.5);object-fit:cover;flex-shrink:0" >';
						}
						return null;
					}
                    
                    $str = ['{backimage}','{backcolor}','{favicon}','{providerName}','{loadingurl}','{image}','{title}','{description}'];
                    $type='done';
                    
                    $curl = curl_init('https://api.microlink.io/?url='.$url);
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
                    
                    if($arraypage[1]['publisher']!=null) {
                        $publisher=$arraypage[1]['publisher'];    
                    }
                    
                    if($arraypage[1]['logo']!=null) {
                        $logo=$arraypage[1]['logo']['url'];
                    }
                    
                    if($arraypage[1]['url']!=null) {
                        $urlpage=$arraypage[1]['url'];
                    }
                    
                    if($arraypage[1]['image']!=null) {
                        $image=$arraypage[1]['image']['url'];
                    }
                    
                    if($arraypage[1]['title']!=null) {
                        $title=$arraypage[1]['title'];
                    }
                    
                    if($arraypage[1]['description']!=null) {
                        $description=$arraypage[1]['description'];
                    }
                    
                    $fav='<img src="'.$logo.'" alt="Profile Picture" style="width:44px;height:44px;border-radius:50%;border:2px solid rgba(0,212,255,0.5);object-fit:cover;flex-shrink:0" >';
                    $rplc =['','',$fav,$publisher,$urlpage,printImage($image),printText($title),printText($description)];
                    $code = Page::where('id',1)->value('code');
                    $divstr=str_replace($str,$rplc,$code);
                    
                    $arrayfields[] = [
                        'emoji_marker' => '',
                        'font_size' => '',
                        'caption' => '',
                        'url' => $divstr,
                        'pinned' => false
                    ];
                    
                    return $arrayfields;
                }
            }
        }
        
        $arrayfields[] = [
            'emoji_marker' => '',
            'font_size' => '',
            'caption' => '',
            'url' => $linktreelink,
            'pinned' => false
        ];
        
        return $arrayfields;
    }
	
	public function destroy($id)
{
    $funnel = EzFunnel::withCount(['customDomains', 'handleDomains'])
        ->where('id', $id)
        ->where('user_id', auth()->id())
        ->firstOrFail();

    // Check if funnel has any domains
    if ($funnel->custom_domains_count > 0 || $funnel->handle_domains_count > 0) {
        return response()->json([
            'success' => false,
            'message' => 'Cannot delete funnel with associated domains. Delete the domains first.'
        ], 400);
    }

    // Delete related records first
    $funnel->fields()->delete();
    $funnel->effectSettings()->delete();
    $funnel->seoSettings()->delete();
    $funnel->logoSettings()->delete();

    // Then delete the funnel
    $funnel->delete();

    return response()->json([
        'success' => true,
        'message' => 'Funnel deleted successfully'
    ]);
}

/**
 * Delete a custom domain
 */
/**
 * Delete a custom domain and its associated sell record
 */
public function destroyCustomDomain($id)
{
    $domain = Customdomain::where('id', $id)
        ->whereHas('funnel', function($query) {
            $query->where('user_id', auth()->id());
        })
        ->firstOrFail();

    // Delete associated sell record if it exists
    Sell::where('sellid', $id)
        ->where('type', 'CUSTOM')
        ->delete();

    $domain->delete();

    return response()->json([
        'success' => true,
        'message' => 'Custom domain deleted successfully'
    ]);
}

/**
 * Delete a handle domain and its associated sell record
 */
public function destroyHandleDomain($id)
{
    $domain = Domain::where('id', $id)
        ->whereHas('funnel', function($query) {
            $query->where('user_id', auth()->id());
        })
        ->firstOrFail();

    // Delete associated sell record if it exists
    Sell::where('sellid', $id)
        ->where('type', 'DOMAIN')
        ->delete();

    $domain->delete();

    return response()->json([
        'success' => true,
        'message' => 'Handle domain deleted successfully'
    ]);
}

}