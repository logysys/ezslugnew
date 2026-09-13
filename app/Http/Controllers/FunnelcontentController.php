<?php

namespace App\Http\Controllers;

use App\Models\EzFunnel;
use App\Models\EzFunnelField;
use App\Models\Frontpage;
use App\Models\EffectSetting;
use App\Models\FunnelSeoSetting;
use App\Models\Customdomain;
use App\Models\Themecollection;
use App\Models\FunnelLogoSetting;
use App\Models\Domain;
use App\Models\Admindomain;
use App\Models\MagicLink;
use App\Models\User;
use App\Models\Emaildesign;
use App\Models\Template;
use App\Models\Incentive;
use App\Models\UserBalance;
use App\Models\Invoice;
use App\Models\IncentiveHistory;
use App\Models\TokenTransaction;
use App\Models\Setting;
use App\Models\TokenInfo;
use App\Models\ReserveTransaction;
use App\Models\Page;
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
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Mail;
use App\Mail\Eznew;
use App\Services\InvoiceService;
use Carbon\Carbon;

class FunnelcontentController extends Controller
{
	
	public function storeezfunnel(Request $request)
	{
	 $validated = $request->validate([
            'funnel_id' => 'required|exists:ez_funnels,token',
            'email' => 'required|email',
            'reference' => 'nullable|string',
            'url' => 'nullable|string', // Text/Embed content
            'link_url' => 'nullable|url', // Simple link
            'image' => 'nullable|file|mimes:jpeg,png,jpg,gif,svg,webp,pdf|max:102400',
        ]);

        // Custom validation to ensure at least one content field is present
        if (!$request->url && !$request->link_url && !$request->hasFile('image')) {
				return response()->json(['success' => false, 'message' => 'Please provide at least one form of content (text/embed, image, or link).'], 422);
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
			$htmlnotsupport=false;
			$aladinurlredirectembed='';
			$type='';
			$done='';
			$contentType = 'text'; // Default type
			$originalContent = '';
			$contentType = 'text';
		// Check if 'content' is an uploaded file (from the 'Images' tab)
		$imageUrl = null;
		if ($request->hasFile('image')) {
            // Store in 'public/funnel_content' and get the relative path
            $file = $request->file('image');
            $fileType = $file->getClientMimeType();
            $originalName = $file->getClientOriginalName();
            $extension = $file->getClientOriginalExtension();
            
            // Generate filename with appropriate extension
            $imageName = time() . '_' . Str::random(5) . '.' . $extension;
            $destinationPath = public_path('funnelcontent');

            if (!file_exists($destinationPath)) {
                mkdir($destinationPath, 0755, true);
            }
            $file->move($destinationPath, $imageName);
            $imageUrl = 'funnelcontent/' . $imageName;
            
            // Set content type based on file type
            if ($fileType === 'application/pdf') {
                $contentType = 'pdf';
            } else {
                $contentType = 'image';
            }
        }
		if (!empty($validated['url'])) {			
			$originalContent = $validated['url'];
			$parse = explode('/',$validated['url']);
			$fullDomain = idn_to_utf8(get_domain($validated['url']));
			$domains = Admindomain::where('domain', $fullDomain)->first();
			if(!empty($domains)){
				if (filter_var($validated['url'], FILTER_VALIDATE_URL)) {
				$aladinurlredirectembed.='<iframe src="'.$validated['url'].'" height="888" width="100%" frameborder="0" scrolling="yes" allowfullscreen="true"></iframe>';
				$done='done';	
				}
			}
			if(isset($parse[3])){
			$linkdomain=$parse[0].'//'.$parse[2].'/';
			$search=$parse[3];
			$urlnew=$validated['url'];
			if('tiktok.com'==get_domain($validated['url']) || 'www.tiktok.com'==get_domain($validated['url'])){
				$aladinurlredirectembed.='<blockquote class="tiktok-embed" cite="'.$validated['url'].'" data-unique-id="melonnt" data-embed-type="creator" style="max-width: 780px; min-width: 288px;" > <section> <a target="_blank" href="'.$validated['url'].'?refer=creator_embed">'.$search.'</a> </section> </blockquote> <script async src="https://www.tiktok.com/embed.js"></script>';
				$done='done';
					
				}
			elseif($linkdomain=='https://kick.com/'){
				$aladinurlredirectembed.='<iframe src="https://player.kick.com/'.$search.'" height="888" width="100%" frameborder="0" scrolling="yes" allowfullscreen="true"></iframe>';
				$done='done';
					
				}elseif($linkdomain=='https://live.arrival.space/'){
				$aladinurlredirectembed.='<iframe src="https://live.arrival.space/'.$search.'" height="888" width="100%" frameborder="0" scrolling="yes" allowfullscreen="true"></iframe>';
				$done='done';
					
				}elseif('reddit.com'==get_domain($validated['url']) || 'www.reddit.com'==get_domain($validated['url'])){	
				$aladinurlredirectembed.='<blockquote class="reddit-embed-bq" style="height:500px" data-embed-height="740"><a href="'.$validated['url'].'"></a></blockquote><script async="" src="https://embed.reddit.com/widgets.js" charset="UTF-8"></script>';
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
			
			if (!filter_var($validated['url'], FILTER_VALIDATE_URL))
				{
					$aladinurlredirectembed.=$validated['url'];
				}else
				{
				$urlparse = $validated['url'];
				$parsed_url = parse_url($urlparse);
				if (isset($parsed_url['host'])) {
					$domain = $parsed_url['host'];
				} else {
					$domain = '';
				}
				$punycodeDomain = idn_to_ascii($domain); 
				$pndomain=str_replace($domain, $punycodeDomain, $validated['url']);
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
								$fav='<img src="'.$logo.'" width="20px;" >';
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
								$fav='<img src="'.$logo.'" width="20px;" >';
								$rplc =['','',$fav,$publisher,$urlpage,printImage($image),printText($title),printText($description)];
								}
								
								$code = Page::where('id',1)->value('code');
								$divstr=str_replace($str,$rplc,$code);
								$aladinurlredirectembed.=$divstr;
								} catch (Exception $e) {
									$aladinurlredirectembed.=$e->getMessage();
								}
								}else{
									$aladinurlredirectembed.='Unsupported domain.'.$pndomain;
								}
								}
								
								}	
						}
					}

				}
			}	
		}
		$funnel = EzFunnel::where('token', $validated['funnel_id'])->first();
			try {
					$email = strtolower($validated['email']);
					
					// Get or create user
					$user = User::firstOrCreate(['email' => $email]);
					if($user->id!=$funnel->user_id){
					// Get incentive
					$incentive = Incentive::find(3);
					if (!$incentive) {
						throw new \Exception('Incentive not found');
					}
					$amount = $incentive->amount;
					$incentiveHistory = IncentiveHistory::create([
						'incentive_id' => $incentive->incentive_id,
						'user_id' => $user->id,
						'amount' => $incentive->amount,
						'incentive_type' => $incentive->incentive_type,
						'description' => 'Add Frame incentive',
						'status' => 'distributed',
						'reference_type' => 'Add Frame',
						'reference_id' => $user->id,
						'distributed_at' => now(),
						'notes' => 'Automatically distributed upon Add Frame incentive'
					]);	
		
					$invoice = Invoice::create([
							'invoice_number' => 'INC-' . strtoupper(Str::random(8)),
							'user_id' => $user->id,
							'incentive_id' => $incentive->incentive_id,
							'issue_date' => now(),
							'due_date' => now()->addDays(30),
							'amount' => $incentive->amount,
							'status' => 'paid',
							'items' => [
								[
									'description' => "Add Frame incentive",
									'quantity' => 1,
									'unit_price' => $incentive->amount,
									'amount' => $incentive->amount,
								]
							],
							'notes' => 'Thank you for Add Frame incentive! Enjoy your incentive EZ$.',
						]);
					// Handle user balance
					$userBalance = UserBalance::firstOrNew(['user_id' => $user->id]);
					$previous_balance = $userBalance->bee_points_balance ?? 0;
					
					if ($userBalance->exists) {
						$userBalance->bee_points_balance += $amount;
					} else {
						$userBalance->user_id = $user->id;
						$userBalance->bee_points_balance = $amount;
					}
					
					$userBalance->save();
					$new_balance = $userBalance->bee_points_balance;
					TokenTransaction::create([
								'user_id' => $user->id,
								'amount' => $incentive->amount, // Negative for deduction
								'transaction_type' => 'Frame_incentive',
								'balance_before' => $userBalance->bee_points_balance,
								'balance_after' => $userBalance->bee_points_balance + $incentive->amount,
							]);
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
						'reason' => 'Frame Incentive',
						'reference_id' => $invoiceNumber,
						'admin_id' => 2,
						'user_id' => $user->id,
						'recipient_email' => $user->email // Store the email for future reference
					]);

					// Generate invoice
					InvoiceService::createForReserveTransaction($transaction);
					// Create magic link only after all other operations succeed
					$magicLink = $user->createMagicLink();
					$signedUrl = URL::temporarySignedRoute(
						'magic-link.verify',
						now()->addMinutes(60),
						['token' => $magicLink->token]
					);
					
					// Prepare email
					$emaildesign = Emaildesign::find(17);
					if (!$emaildesign) {
						throw new \Exception('Email template not found');
					}
					
					$replacements = [
						'{email}' => $email,
						'{funnellink}' => $signedUrl,
						'{previous_balance}' => $previous_balance,
						'{new_balance}' => $new_balance,
						'{incentive}' => $amount
					];
					
					$emailContent = str_replace(
						array_keys($replacements),
						array_values($replacements),
						$emaildesign->design
					);
					
					// Send email
					$subject = "Ez.wiki Your Incentive and Magic Login Link";
					Mail::to($email)->send(new Eznew(['design' => $emailContent], $subject));
					Mail::getSymfonyTransport()->stop();
					}
				} catch (\Exception $e) {
					// Handle error appropriately (log it, notify admin, etc.)
					throw $e; // or return an error response
				}
			
			$effect = EzFunnelField::where('ez_funnel_id', $funnel->id)->get();

			foreach ($effect as $effectItem) {
				EzFunnelField::where('id', $effectItem->id)->update([
					'position' => $effectItem->position + 1,
				]);
			}
			$emojiMarker = '0️⃣';
			$approve='NOT APPROVED';
			if ($funnel->visibility == 0) {
				$emojiMarker = '1️⃣';
				$approve='APPROVED';
			}
			$newField = EzFunnelField::create([
				'ez_funnel_id' => $funnel->id,
				'user_id' => $user->id,
				'unique_id' => null,
				'emoji_marker' => $emojiMarker,
				'font_size' => '9px',
				'caption' => null,
				'url' => $aladinurlredirectembed,
				'image_url' => $imageUrl,
                'link_url' => $validated['link_url'] ?? null,
				'orignal_url' => $originalContent,
				'pinned' => 0,
				'position' => 0,
				'reference' => $validated['reference'] ?? null,
				'post_type' => 'visitor',
				'approve' => $approve,
			]);
			
            $userData = [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'profile_photo_url' => $user->profile_photo_url ?? null,
                        'is_verified' => $user->email_verified_at !== null,
                    ];
			
			return response()->json([
			'success' => true,
			'message' => 'Content added successfully!',
			'newContent' => [
				'id' => $newField->id,
				'title' => $newField->caption ?? '',
				'url' => $newField->url ? str_replace('{timeago}', $newField->created_at ? $newField->created_at->diffForHumans() : '', $newField->url) : '',
				'image_url' => $newField->image_url,
				'link_url' => $newField->link_url,
				'width' => '30%', // Default width for new content
				'emoji_marker' => $newField->emoji_marker,
				'pinned' => 0,
				'reference' => $newField->reference,
				'content_type' => $contentType,
				'user' => $userData,
				'created_at' => $newField->created_at ? $newField->created_at->toISOString() : null,
                'post_type' => $newField->post_type
			]
			]);
					
	}
	
	public function getuserbalance(Request $request)
	{
		$email = strtolower($request->query('email'));
		if (!$email) {
			return response()->json(['error' => 'Email required'], 400);
		}

		$user = User::where('email', $email)->first();
		if (!$user) {
			return response()->json(['balance' => 0]);
		}

		$balance = $user->balance ? $user->balance->bee_points_balance : 0;
		return response()->json(['balance' => $balance]);
	}
	
	public function cronjobezfunnel()
	{
		$funnels = EzFunnel::orderBy('created_at', 'desc')->get();
		$effectIdsToUpdate = [];
		
		foreach ($funnels as $funnel) {
			// Get all eligible funnel fields for this funnel
			$effects = EzFunnelField::where('ez_funnel_id', $funnel->id)
				->where('emoji_marker', '0️⃣')
				->get();
			
			foreach ($effects as $effect) {
				// Parse HH:MM format and convert to minutes/seconds
				$timeParts = explode(':', $funnel->timer);
				$hours = (int) $timeParts[0];
				$minutes = (int) $timeParts[1];
				
				// Calculate target time by adding hours and minutes
				$targetTime = $effect->created_at->addHours($hours)->addMinutes($minutes);
				$now = Carbon::now();
				
				// Check if the target time has passed
				if ($targetTime->lessThanOrEqualTo($now)) {
					$effectIdsToUpdate[] = $effect->id;
				}
			}
		}
		
		// Bulk update all eligible records at once
		if (!empty($effectIdsToUpdate)) {
			EzFunnelField::whereIn('id', $effectIdsToUpdate)
				->update(['emoji_marker' => '1️⃣']);
		}
	}
	
	public function preview($frameid)
    {
        $frame = EzFunnelField::where('unique_id','F'.$frameid)->first();
        
        return Inertia::render('previewframe', [
            'frame' => $frame,
            'auth' => [
                'user' => auth()->user() ?? null
            ]
        ]);
    }
	
	public function storeezfunneloki(Request $request)
	{
	 $validated = $request->validate([
            'email' => 'required|email',
            'reference' => 'nullable|string',
            'url' => 'nullable|string', // Text/Embed content
            'link' => 'nullable|url', // Simple link
            'image' => 'nullable|file|mimes:jpeg,png,jpg,gif,svg,webp,pdf|max:102400',
        ]);

        // Custom validation to ensure at least one content field is present
        if (!$request->url && !$request->link && !$request->hasFile('image')) {
				return response()->json(['success' => false, 'message' => 'Please provide at least one form of content (text/embed, image, or link).'], 422);
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
			$htmlnotsupport=false;
			$aladinurlredirectembed='';
			$type='';
			$done='';
			$contentType = 'text'; // Default type
			$originalContent = '';
			$contentType = 'text';
		// Check if 'content' is an uploaded file (from the 'Images' tab)
		$imageUrl = null;

		if ($request->hasFile('image')) {
            // Store in 'public/funnel_content' and get the relative path
            $file = $request->file('image');
            $fileType = $file->getClientMimeType();
            $originalName = $file->getClientOriginalName();
            $extension = $file->getClientOriginalExtension();
            
            // Generate filename with appropriate extension
            $imageName = time() . '_' . Str::random(5) . '.' . $extension;
            $destinationPath = public_path('funnelcontent');

            if (!file_exists($destinationPath)) {
                mkdir($destinationPath, 0755, true);
            }
            $file->move($destinationPath, $imageName);
            $imageUrl = 'funnelcontent/' . $imageName;
            
            // Set content type based on file type
            if ($fileType === 'application/pdf') {
                $contentType = 'pdf';
            } else {
                $contentType = 'image';
            }
        }
		$contenturl=$validated['url'];
		if (empty($validated['url'])) {
			$contenturl=$validated['link'];
		}
		if (!empty($contenturl)) {			
			$originalContent = $contenturl;
			$parse = explode('/',$contenturl);
			if(isset($parse[3])){
			$linkdomain=$parse[0].'//'.$parse[2].'/';
			$search=$parse[3];
			$urlnew=$contenturl;
			if('tiktok.com'==get_domain($contenturl) || 'www.tiktok.com'==get_domain($contenturl)){
				$aladinurlredirectembed.='<blockquote class="tiktok-embed" cite="'.$contenturl.'" data-unique-id="melonnt" data-embed-type="creator" style="max-width: 780px; min-width: 288px;" > <section> <a target="_blank" href="'.$contenturl.'?refer=creator_embed">'.$search.'</a> </section> </blockquote> <script async src="https://www.tiktok.com/embed.js"></script>';
				$done='done';
					
				}
			elseif($linkdomain=='https://kick.com/'){
				$aladinurlredirectembed.='<iframe src="https://player.kick.com/'.$search.'" height="888" width="100%" frameborder="0" scrolling="yes" allowfullscreen="true"></iframe>';
				$done='done';
					
				}elseif($linkdomain=='https://live.arrival.space/'){
				$aladinurlredirectembed.='<iframe src="https://live.arrival.space/'.$search.'" height="888" width="100%" frameborder="0" scrolling="yes" allowfullscreen="true"></iframe>';
				$done='done';
					
				}elseif('reddit.com'==get_domain($contenturl) || 'www.reddit.com'==get_domain($contenturl)){	
				$aladinurlredirectembed.='<blockquote class="reddit-embed-bq" style="height:500px" data-embed-height="740"><a href="'.$contenturl.'"></a></blockquote><script async="" src="https://embed.reddit.com/widgets.js" charset="UTF-8"></script>';
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
			
			if (!filter_var($contenturl, FILTER_VALIDATE_URL))
				{
					$aladinurlredirectembed.=$contenturl;
				}else
				{
				$urlparse = $contenturl;
				$parsed_url = parse_url($urlparse);
				if (isset($parsed_url['host'])) {
					$domain = $parsed_url['host'];
				} else {
					$domain = '';
				}
				$punycodeDomain = idn_to_ascii($domain); 
				$pndomain=str_replace($domain, $punycodeDomain, $contenturl);
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
								$fav='<img src="'.$logo.'" width="20px;" >';
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
								$fav='<img src="'.$logo.'" width="20px;" >';
								$rplc =['','',$fav,$publisher,$urlpage,printImage($image),printText($title),printText($description)];
								}
								
								$code = Page::where('id',1)->value('code');
								$divstr=str_replace($str,$rplc,$code);
								$aladinurlredirectembed.=$divstr;
								} catch (Exception $e) {
									$aladinurlredirectembed.=$e->getMessage();
								}
								}else{
									$aladinurlredirectembed.='Unsupported domain.'.$pndomain;
								}
								}
								
								}	
						}
					}

				}
			}	
		}
		
		$email = strtolower($validated['email']);
		$user = User::where('email', $email)->first();
		if(empty($user)){						
		$user = User::firstOrCreate(['email' => $email]);
		$magicLink = $user->createMagicLink();

		$signedUrl = URL::temporarySignedRoute(
			'magic-link.verify',
			now()->addMinutes(60),
			['token' => $magicLink->token]
		);
		$incentive = Incentive::where('incentive_id',1)->first();
		$userBalance = UserBalance::where('user_id', $user->id)->first();	
		
		if ($userBalance) {
			$userBalance->bee_points_balance += $incentive->amount;
			$userBalance->save();
		} else {
			$userBalance = UserBalance::create([
				'user_id' => $user->id,
				'bee_points_balance' => $incentive->amount
			]);
		}
		$incentiveHistory = IncentiveHistory::create([
			'incentive_id' => $incentive->incentive_id,
			'user_id' => $user->id,
			'amount' => $incentive->amount,
			'incentive_type' => $incentive->incentive_type,
			'description' => 'Signup incentive',
			'status' => 'distributed',
			'reference_type' => 'signup',
			'reference_id' => $user->id,
			'distributed_at' => now(),
			'notes' => 'Automatically distributed upon Signup incentive'
		]);	
	
		$invoice = Invoice::create([
				'invoice_number' => 'INC-' . strtoupper(Str::random(8)),
				'user_id' => $user->id,
				'incentive_id' => $incentive->incentive_id,
				'issue_date' => now(),
				'due_date' => now()->addDays(30),
				'amount' => $incentive->amount,
				'status' => 'paid',
				'items' => [
					[
						'description' => "Signup Incentive",
						'quantity' => 1,
						'unit_price' => $incentive->amount,
						'amount' => $incentive->amount,
					]
				],
				'notes' => 'Thank you for signing up! Enjoy your incentive EZ$.',
			]);
		TokenTransaction::create([
								'user_id' => $user->id,
								'amount' => $incentive->amount, // Negative for deduction
								'transaction_type' => 'signup_incentive',
								'balance_before' => $userBalance->bee_points_balance,
								'balance_after' => $userBalance->bee_points_balance + $incentive->amount,
							]);
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
			'reason' => 'Signup Incentive',
			'reference_id' => $invoiceNumber,
			'admin_id' => 2,
			'user_id' => $user->id,
			'recipient_email' => $user->email // Store the email for future reference
		]);
		// Generate invoice
		InvoiceService::createForReserveTransaction($transaction);
		// Send email with the magic link
		$emaildesign = Emaildesign::where('id', 16)->first();
		$str = ['{token}'];
		$rplc =[$signedUrl];
		$div=str_replace($str,$rplc,$emaildesign['design']);
		$mailData = [
							'design' => $div
						];
		
		try{
			   $subject = "Ez.wiki Your Magic Login Link";
				Mail::to(strtolower($email))->send(new Eznew($mailData, $subject));
				Mail::getSymfonyTransport()->stop();
			}catch (\Exception $e){
					$subject = "Ez.wiki Your Magic Login Link";
					
					@mail($request->email, $subject, $div, null,'funnel@ez.wiki');
			}
		
		}
		
		$originalFunnel = EzFunnel::findOrFail(40);
		$clonedFunnel = $originalFunnel->replicate();
		$clonedFunnel->user_id = $user->id;
		$clonedFunnel->save();
		if (!empty($originalFunnel->theme)) {
				$themeIds = array_filter(explode(',', $originalFunnel->theme));
				$existingThemes = Themecollection::where('user_id', $user->id)
					->whereIn('theme_id', $themeIds)
					->pluck('theme_id')
					->toArray();
				
				$newThemes = array_diff($themeIds, $existingThemes);
				$userID=$user->id;
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
		// Clone funnel fields if they exist
		$originalFields = EzFunnelField::where('ez_funnel_id', 896)->get();
		foreach ($originalFields as $originalField) {
			$clonedField = $originalField->replicate();
			$clonedField->ez_funnel_id = $clonedFunnel->id;
			$clonedField->unique_id = null;
			$clonedField->save();
		}

		// Clone funnel logo settings if they exist
		$originalLogo = FunnelLogoSetting::where('funnel_id', 896)->first();
		if ($originalLogo) {
			$clonedLogo = $originalLogo->replicate();
			$clonedLogo->funnel_id = $clonedFunnel->id;
			$clonedLogo->save();
		}

		// Clone funnel SEO settings if they exist
		$originalSeo = FunnelSeoSetting::where('funnel_id', 896)->first();
		if ($originalSeo) {
			$clonedSeo = $originalSeo->replicate();
			$clonedSeo->funnel_id = $clonedFunnel->id;
			$clonedSeo->save();
		}
			
		$userBalance = UserBalance::where('user_id', $user->id)->first();
		$incentive = Incentive::where('incentive_id', 2)->first();
		$amount = $incentive->amount;

		if ($userBalance) {
			$userBalance->bee_points_balance += $amount;
			$userBalance->save();
		} else {
			$userBalance = UserBalance::create([
				'user_id' => $user->id,
				'bee_points_balance' => $amount
			]);
		}
		$incentiveHistory = IncentiveHistory::create([
			'incentive_id' => $incentive->incentive_id,
			'user_id' => $user->id,
			'amount' => $incentive->amount,
			'incentive_type' => $incentive->incentive_type,
			'description' => 'Create Funnel incentive',
			'status' => 'distributed',
			'reference_type' => 'Create Funnel',
			'reference_id' => $user->id,
			'distributed_at' => now(),
			'notes' => 'Automatically distributed upon Create Funnel incentive'
		]);	
	
		$invoice = Invoice::create([
				'invoice_number' => 'INC-' . strtoupper(Str::random(8)),
				'user_id' => $user->id,
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
		TokenTransaction::create([
				'user_id' => $user->id,
				'amount' => $incentive->amount, // Negative for deduction
				'transaction_type' => 'funnel_incentive',
				'balance_before' => $userBalance->bee_points_balance,
				'balance_after' => $userBalance->bee_points_balance + $incentive->amount,
			]);
		
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
			'user_id' => $user->id,
			'recipient_email' => $user->email // Store the email for future reference
		]);

		// Generate invoice
		InvoiceService::createForReserveTransaction($transaction);
		$newField = EzFunnelField::create([
				'ez_funnel_id' => $clonedFunnel->id,
				'user_id' => $user->id,
				'unique_id' => null,
				'emoji_marker' => '1️⃣',
				'font_size' => '9px',
				'caption' => null,
				'url' => $aladinurlredirectembed,
				'image_url' => $imageUrl,
                'link_url' => $validated['link'] ?? null,
				'orignal_url' => $originalContent,
				'pinned' => 0,
				'position' => 0,
				'reference' => $validated['reference'] ?? null,
				'post_type' => 'visitor',
				'approve' => 'APPROVED',
				'position' => 0,
			]);	
	$ezfunnel = EzFunnel::findOrFail($clonedFunnel->id);
	$fulldomain='ez.wiki/'.$ezfunnel->token;
	$emaildesign = Emaildesign::where('id', 21)->first();
		$fullfunnel="https://ez.wiki/".$ezfunnel->token;
		$str = ['{fullfunnel}', '{incentive}', '{url}', '{createdate}'];
		$rplc = [$fullfunnel, $amount, $fullfunnel, now()];
		$div = str_replace($str, $rplc, $emaildesign['design']);
		$mailData = ['design' => $div];
		$email = $user->email;
		try {
			$subject = "Ez.wiki Congratulations on your new funnel.";
			Mail::to(strtolower($email))->send(new Eznew($mailData, $subject));
			Mail::getSymfonyTransport()->stop();
		} catch (\Exception $e) {
			$subject = "Ez.wiki Congratulations on your new funnel.";
			@mail($email, $subject, $div, null, 'funnel@ez.wiki');
		}
	return response()->json([
				'success' => true,
				'url' => $fulldomain,
				'message' => 'Funnel created successfully!',
				'html_content' => '<a href="' . $fulldomain . '" target="_blank" class="btn btn-warning reloadcreatenew">' . $fulldomain . '</a>',
				'available' => true
			]);
	}
	
	public function previewlink(Request $request)
	{
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
		$htmlnotsupport=false;
		$aladinurlredirectembed='';
		$type='';
		$done='';
		$contentType = 'text'; // Default type
		$originalContent = '';
		$contentType = 'text';
		$contenturl=$request->url;
		if (!empty($contenturl)) {			
			$originalContent = $contenturl;
			$parse = explode('/',$contenturl);
			$fullDomain = idn_to_utf8(get_domain($contenturl));
			$domains = Admindomain::where('domain', $fullDomain)->first();
			if(!empty($domains)){
				if (filter_var($contenturl, FILTER_VALIDATE_URL)) {
				$aladinurlredirectembed.='<iframe src="'.$contenturl.'" height="888" width="100%" frameborder="0" scrolling="yes" allowfullscreen="true"></iframe>';
				$done='done';	
				}
			}
			if(isset($parse[3])){
			$linkdomain=$parse[0].'//'.$parse[2].'/';
			$search=$parse[3];
			$urlnew=$contenturl;
			if('tiktok.com'==get_domain($contenturl) || 'www.tiktok.com'==get_domain($contenturl)){
				$aladinurlredirectembed.='<blockquote class="tiktok-embed" cite="'.$contenturl.'" data-unique-id="melonnt" data-embed-type="creator" style="max-width: 780px; min-width: 288px;" > <section> <a target="_blank" href="'.$contenturl.'?refer=creator_embed">'.$search.'</a> </section> </blockquote> <script async src="https://www.tiktok.com/embed.js"></script>';
				$done='done';
					
				}
			elseif($linkdomain=='https://kick.com/'){
				$aladinurlredirectembed.='<iframe src="https://player.kick.com/'.$search.'" height="888" width="100%" frameborder="0" scrolling="yes" allowfullscreen="true"></iframe>';
				$done='done';
					
				}elseif($linkdomain=='https://live.arrival.space/'){
				$aladinurlredirectembed.='<iframe src="https://live.arrival.space/'.$search.'" height="888" width="100%" frameborder="0" scrolling="yes" allowfullscreen="true"></iframe>';
				$done='done';
					
				}elseif('reddit.com'==get_domain($contenturl) || 'www.reddit.com'==get_domain($contenturl)){	
				$aladinurlredirectembed.='<blockquote class="reddit-embed-bq" style="height:500px" data-embed-height="740"><a href="'.$contenturl.'"></a></blockquote><script async="" src="https://embed.reddit.com/widgets.js" charset="UTF-8"></script>';
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
			
			if (!filter_var($contenturl, FILTER_VALIDATE_URL))
				{
					$aladinurlredirectembed.=$contenturl;
				}else
				{
				$urlparse = $contenturl;
				$parsed_url = parse_url($urlparse);
				if (isset($parsed_url['host'])) {
					$domain = $parsed_url['host'];
				} else {
					$domain = '';
				}
				$punycodeDomain = idn_to_ascii($domain); 
				$pndomain=str_replace($domain, $punycodeDomain, $contenturl);
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
								$fav='<img src="'.$logo.'" width="20px;" >';
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
								$fav='<img src="'.$logo.'" width="20px;" >';
								$rplc =['','',$fav,$publisher,$urlpage,printImage($image),printText($title),printText($description)];
								}
								
								$code = Page::where('id',1)->value('code');
								$divstr=str_replace($str,$rplc,$code);
								$aladinurlredirectembed.=$divstr;
								} catch (Exception $e) {
									$aladinurlredirectembed.=$e->getMessage();
								}
								}else{
									$aladinurlredirectembed.='Unsupported domain.'.$pndomain;
								}
								}
								
								}	
						}
					}

				}
			}	
		}
		echo $aladinurlredirectembed;
		exit;
	}
}