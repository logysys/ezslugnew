<?php

namespace App\Http\Controllers;

use App\Models\EzFunnel;
use App\Models\MagicLink;
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
use App\Models\Emojimarker;
use App\Models\Page;
use App\Models\User;
use App\Models\Emaildesign;
use App\Models\TokenInfo;
use App\Models\ReserveTransaction;
use App\Models\Invoice;
use App\Models\IncentiveHistory;
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
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Mail;
use App\Mail\Eznew;
use Carbon\Carbon;
use App\Services\InvoiceService;

class MailExtractController extends Controller
{
	public function mailextract(Request $request)
    {
	$hostname = '{webhost.dynadot.com:993/imap/ssl/novalidate-cert}INBOX';
    $username = 'funnel@ez.wiki';
    $password = '29536790';
	$imapStream = imap_open($hostname, $username, $password) or die('Cannot connect to GoDaddy mail server: ' . imap_last_error());
	$mailuid = Setting::where('id',1)->value('mailuid');
	$setting = Setting::where('id', 1)->first();
	$startUid = $mailuid+1;
	$uid = $mailuid;
	$emoji = '📣';
	$pattern = '/📣\/X/'; 
	$pattern1 = '/📌\/X/';
	$pattern2 = '📒';
	$pattern3 = '/📒\/X/';
	$pattern4 = '/0️⃣\//';
	$pattern5 = '/1️⃣\//';
	$pattern6 = '/3️⃣\//';
	$pattern7 = '/2️⃣\//';
	$pattern10 = '/4️⃣\//';
	$pattern11 = '/5️⃣\//';
	$pattern8 = '/🔐\//';
	$pattern9 = '🚀';
	function getBody($imapStream, $uid, $structure) {
			if (!isset($structure->parts)) {
				return imap_fetchbody($imapStream, $uid, 1, FT_UID);
			}
			$textBody = '';
			$htmlBody = '';
			for ($i = 0; $i < count($structure->parts); $i++) {
			$part = $structure->parts[$i];
			$encoding = $part->encoding;
			$subtype = isset($part->subtype) ? $part->subtype : '';
			
			if ($subtype == 'PLAIN') {
				$textBody = imap_fetchbody($imapStream, $uid, $i + 1,FT_UID);
				if ($encoding == 3) {
					$textBody = base64_decode($textBody);
				} elseif ($encoding == 4) {
					$textBody = quoted_printable_decode($textBody);
				}
			}
			
			if ($subtype == 'HTML') {
				$htmlBody = imap_fetchbody($imapStream, $uid, $i + 1, FT_UID);
				if ($encoding == 3) {
					$htmlBody = base64_decode($htmlBody);
				} elseif ($encoding == 4) {
					$htmlBody = quoted_printable_decode($htmlBody);
				}
			}
			}
			
			return !empty($htmlBody) ? $htmlBody : $textBody;
	}
	
function get_domain($url)
				{
				  $pieces = parse_url($url);
				  $domain = isset($pieces['host']) ? $pieces['host'] : $pieces['path'];
				  if (preg_match('/(?P<domain>[a-z0-9][a-z0-9\-]{1,63}\.[a-z\.]{2,6})$/i', $domain, $regs)) {
					return $regs['domain'];
				  }
				  return false;
				}
				function printText(?string $text)
				{
					if ($text) {
					return htmlspecialchars($text, ENT_IGNORE);
					}
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
				function isCSS($text) {
				$pattern = '/\.[a-zA-Z0-9_-]+{[^}]*}/';
				if (preg_match($pattern, $text)) {
					return false;
				}
				return true;
				}
				function random_color_part() {
				 return str_pad( dechex( mt_rand( 0, 255 ) ), 2, '0', STR_PAD_LEFT);
				}
	
				function random_color() {
				 return random_color_part() . random_color_part() . random_color_part();
				}
// Search for all UIDs greater than the start UID
$emails = imap_fetch_overview($imapStream, "$startUid:*", FT_UID);
if ($emails) {
    foreach ($emails as $email) {

       $uid = $email->uid;
	   if($uid > $mailuid)
	   {
	   
       $to = $email->to;
	   $from = $email->from;
	   $senderEmail='';
	   if (preg_match('/<(.+?)>/', $from, $matches)) {
            $senderEmail=$matches[1]; 
        }
	   
	   $subject = '';
	   if (isset($email->subject)) {
	   $subject = iconv_mime_decode($email->subject, 0, "UTF-8");
	   }
	   $structure = imap_fetchstructure($imapStream,$uid,FT_UID);
	  	$body = getBody($imapStream, $uid, $structure);
		$beebody =imap_fetchbody($imapStream, $uid, 1, FT_UID);
	   	$decodemail=quoted_printable_decode($beebody);
		$emojimarker = Emojimarker::get()->toArray();
		if(!empty($emojimarker)){
		for ($marker = 0; $marker < count($emojimarker); $marker++) { 
		if(strpos(trim(strip_tags($body)), $emojimarker[$marker]['emoji']) === 0 || preg_match($emojimarker[$marker]['edit_emoji'],trim(strip_tags($body)))) {
		$explode=explode('/',strip_tags($body));
		if(trim($explode[0]) === $emojimarker[$marker]['emoji'] && !preg_match($emojimarker[$marker]['edit_emoji'],trim(strip_tags($body))))
			{				
				$embed=EzFunnel::where('token', $emojimarker[$marker]['handle'])->first();
				if(!empty($embed))
				{
					$texth1title='2️⃣';
				if(preg_match($pattern4,trim(strip_tags($body))))
					{
						$texth1title="0️⃣";
					}
					elseif(preg_match($pattern5,trim(strip_tags($body))))
					{
						$texth1title='1️⃣';
					}
					elseif(preg_match($pattern6,trim(strip_tags($body))))
					{
						$texth1title='3️⃣';
					}
					elseif(preg_match($pattern7,trim(strip_tags($body))))
					{
						$texth1title='2️⃣';
					}elseif(preg_match($pattern10,trim(strip_tags($body))))
					{
						$texth1title='4️⃣';
					}elseif(preg_match($pattern11,trim(strip_tags($body))))
					{
						$texth1title='5️⃣';
					}elseif(preg_match($pattern8,trim(strip_tags($body))))
					{
						$texth1title='🔐';
					}
				$effect = EzFunnelField::where('ez_funnel_id', $embed->id)->get();

				foreach ($effect as $effectItem) {
					EzFunnelField::where('id', $effectItem->id)->update([
						'position' => $effectItem->position + 1,
					]);
				}
				EzFunnelField::create([
						'ez_funnel_id' => $embed->id,
						'unique_id' => null,
						'emoji_marker' => $texth1title,
						'font_size' => '9px',
						'caption' => $subject,
						'url' => html_entity_decode($body),
						'orignal_url' => null,
						'pinned' => 0,
						'position' => 0,
					]);		
				$emaildesign = Emaildesign::where('id', 28)->first();
				$str = ['{url}','{updatedate}','{fullfunnel}'];
				$rplc =[url('/').'/'.$embed->token,now(),url('/').'/'.$embed->token];
				$div=str_replace($str,$rplc,$emaildesign['design']);
				$mailData = [
									'design' => $div
								];
					try{
						$subject = "Ez.wiki Your Funnel Has Been Updated!";
					   Mail::to(strtolower($senderEmail))->send(new Eznew($mailData, $subject));
					   Mail::getSymfonyTransport()->stop();
					}catch (\Exception $e){
							$subject = "Ez.wiki Your Funnel Has Been Updated!";
							
							mail(strtolower($senderEmail), $subject, $div, null,'funnel@ez.wiki');
					}
				}						
			}
                
	   	}
	}
}
		if (strpos(trim(strip_tags($body)), $pattern9) === 0)
		{				$listofmailscon=explode('/',trim(strip_tags($body)));	
						$texth1title='🚀';
						$listofmails=explode('*',trim(strip_tags($body)));
						array_shift($listofmails);
						$user = User::where('email', $senderEmail)->first();
						if(empty($user)){						
						$user = User::firstOrCreate(['email' => $senderEmail]);
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
								Mail::to(strtolower($senderEmail))->send(new Eznew($mailData, $subject));
								Mail::getSymfonyTransport()->stop();
							}catch (\Exception $e){
									$subject = "Ez.wiki Your Magic Login Link";
									
									@mail($request->email, $subject, $div, null,'funnel@ez.wiki');
							}
						
						}
						$ezFunnel = EzFunnel::create([
								'user_id' => $user->id,
								'fly_sign' => 1,
								'eye_tracking' => 1,
								'seo_tag' => null,
								'theme' => '220,21',
								'color' => '#ffffff',
								'transparency' => 80,
							]);
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
						
						foreach ($listofmails as $urlbee) {
						$urlbee = trim($urlbee, " \t\n\r\0\x0B/");
					if (!empty($urlbee)) {
						if (!preg_match("~^(?:f|ht)tps?://~i", $urlbee)) {
								$urlbee = "https://" . $urlbee;
							}
		
						$aladinurlredirectembed='';
						$type='';
						$done='';
						if(isset($urlbee)){
						$parse = explode('/',$urlbee);
						if(isset($parse[3])){
						$linkdomain=$parse[0].'//'.$parse[2].'/';
						$search=$parse[3];
						$urlnew=$urlbee;
						if('tiktok.com'==get_domain($urlbee) || 'www.tiktok.com'==get_domain($urlbee)){
							$aladinurlredirectembed.='<blockquote class="tiktok-embed" cite="'.$urlbee.'" data-unique-id="melonnt" data-embed-type="creator" style="max-width: 780px; min-width: 288px;" > <section> <a target="_blank" href="'.$urlbee.'?refer=creator_embed">'.$search.'</a> </section> </blockquote> <script async src="https://www.tiktok.com/embed.js"></script>';
							$done='done';
							}elseif('reddit.com'==get_domain($urlbee) || 'www.reddit.com'==get_domain($urlbee)){	
							$aladinurlredirectembed.='<blockquote class="reddit-embed-bq" style="height:500px" data-embed-height="740"><a href="'.$urlbee.'"></a></blockquote><script async="" src="https://embed.reddit.com/widgets.js" charset="UTF-8"></script>';
							$done='done';
							}elseif($linkdomain=='https://kick.com/'){
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
						
						if(substr( $urlbee, 0, 1 ) === "<")
							{
								$aladinurlredirectembed.=$urlbee;
							}else
							{
							$urlparse = $urlbee;
							$parsed_url = parse_url($urlparse);
							if (isset($parsed_url['host'])) {
								$domain = $parsed_url['host'];
							} else {
								$domain = '';
							}
							$punycodeDomain = idn_to_ascii($domain); 
							$pndomain=str_replace($domain, $punycodeDomain, $urlbee);
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
										$aladinurlredirectembed.='<iframe loading="lazy" allow="camera; microphone; fullscreen; display-capture; autoplay" style="border: 0;" src="'.$pndomain.'" width="100%" height="888px" allowfullscreen="allowfullscreen" ></iframe>';
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
						
						EzFunnelField::create([
							'ez_funnel_id' => $ezFunnel->id,
							'emoji_marker' => $texth1title,
							'unique_id' => null,
							'font_size' => '9px',
							'caption' => null,
							'url' => html_entity_decode($aladinurlredirectembed),
							'orignal_url' => $urlbee,
							'pinned' => 0,
							'position' => 0,
						]);
					}		
						}
						$emaildesign = Emaildesign::where('id', 21)->first();
						$str = ['{fullfunnel}', '{incentive}', '{url}', '{createdate}'];
						$rplc = [url('/').'/'.$ezFunnel->token, $amount, url('/').'/'.$ezFunnel->token, now()];
						$div = str_replace($str, $rplc, $emaildesign['design']);
						$mailData = ['design' => $div];
						try {
							$subject = "Ez.wiki Congratulations on your new funnel.";
							Mail::to(strtolower($senderEmail))->send(new Eznew($mailData, $subject));
							Mail::getSymfonyTransport()->stop();
						} catch (\Exception $e) {
							$subject = "Ez.wiki Congratulations on your new funnel.";
							@mail(strtolower($senderEmail), $subject, $div, null, 'funnel@ez.wiki');
						}
		}
	   if (strpos(trim(strip_tags($body)), $pattern2) === 0 || preg_match($pattern3,trim(strip_tags($body)))) {
	   	$explode=explode('/',strip_tags($decodemail));
		if(trim($explode[0]) === $pattern2 && !preg_match($pattern3,trim(strip_tags($body))))
					{
						$user = User::where('email', $senderEmail)->first();
						if(empty($user)){						
						$user = User::firstOrCreate(['email' => $senderEmail]);
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
								Mail::to(strtolower($senderEmail))->send(new Eznew($mailData, $subject));
								Mail::getSymfonyTransport()->stop();
							}catch (\Exception $e){
									$subject = "Ez.wiki Your Magic Login Link";
									
									@mail($request->email, $subject, $div, null,'funnel@ez.wiki');
							}
						
						}
							$ezFunnel = EzFunnel::create([
								'user_id' => $user->id,
								'fly_sign' => 1,
								'eye_tracking' => 1,
								'seo_tag' => null,
								'theme' => '220,21',
								'color' => '#ffffff',
								'transparency' => 80,
							]);
						$userBalance = UserBalance::where('user_id', $user->id)->first();
						$incentive = Incentive::where('incentive_id', 2)->first();
						$amount = $incentive->amount;

						if ($userBalance) {
							$userBalance->bee_points_balance += $amount;
							$userBalance->save();
						} else {
							$userBalance=UserBalance::create([
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
						
						$listofmails=explode('*',trim(strip_tags($body)));
						array_shift($listofmails);
						foreach ($listofmails as $urlbee) {
													
					$urlbee = trim($urlbee, " \t\n\r\0\x0B/");
					if (!empty($urlbee)) {
						if (!preg_match("~^(?:f|ht)tps?://~i", $urlbee)) {
								$urlbee = "https://" . $urlbee;
							}
		
						$aladinurlredirectembed='';
						$type='';
						$done='';
						if(isset($urlbee)){
						$parse = explode('/',$urlbee);
						if(isset($parse[3])){
						$linkdomain=$parse[0].'//'.$parse[2].'/';
						$search=$parse[3];
						$urlnew=$urlbee;
						if('tiktok.com'==get_domain($urlbee) || 'www.tiktok.com'==get_domain($urlbee)){
							$aladinurlredirectembed.='<blockquote class="tiktok-embed" cite="'.$urlbee.'" data-unique-id="melonnt" data-embed-type="creator" style="max-width: 780px; min-width: 288px;" > <section> <a target="_blank" href="'.$urlbee.'?refer=creator_embed">'.$search.'</a> </section> </blockquote> <script async src="https://www.tiktok.com/embed.js"></script>';
							$done='done';
								
							}elseif('reddit.com'==get_domain($urlbee) || 'www.reddit.com'==get_domain($urlbee)){	
							$aladinurlredirectembed.='<blockquote class="reddit-embed-bq" style="height:500px" data-embed-height="740"><a href="'.$urlbee.'"></a></blockquote><script async="" src="https://embed.reddit.com/widgets.js" charset="UTF-8"></script>';
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
						
						if(substr( $urlbee, 0, 1 ) === "<")
							{
								$aladinurlredirectembed.=$urlbee;
							}else
							{
							$urlparse = $urlbee;
							$parsed_url = parse_url($urlparse);
							if (isset($parsed_url['host'])) {
								$domain = $parsed_url['host'];
							} else {
								$domain = '';
							}
							$punycodeDomain = idn_to_ascii($domain); 
							$pndomain=str_replace($domain, $punycodeDomain, $urlbee);
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
										$aladinurlredirectembed.='<iframe loading="lazy" allow="camera; microphone; fullscreen; display-capture; autoplay" style="border: 0;" src="'.$pndomain.'" width="100%" height="888px" allowfullscreen="allowfullscreen" ></iframe>';
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
						$texth1title='2️⃣';
						if(preg_match($pattern4,trim(strip_tags($body))))
							{
								$texth1title="0️⃣";
							}
							elseif(preg_match($pattern5,trim(strip_tags($body))))
							{
								$texth1title='1️⃣';
							}
							elseif(preg_match($pattern6,trim(strip_tags($body))))
							{
								$texth1title='3️⃣';
							}
							elseif(preg_match($pattern7,trim(strip_tags($body))))
							{
								$texth1title='2️⃣';
							}elseif(preg_match($pattern10,trim(strip_tags($body))))
							{
								$texth1title='4️⃣';
							}elseif(preg_match($pattern11,trim(strip_tags($body))))
							{
								$texth1title='5️⃣';
							}elseif(preg_match($pattern8,trim(strip_tags($body))))
							{
								$texth1title='🔐';
							}
						EzFunnelField::create([
							'ez_funnel_id' => $ezFunnel->id,
							'emoji_marker' => $texth1title,
							'unique_id' => null,
							'font_size' => '9px',
							'caption' => null,
							'url' => html_entity_decode($aladinurlredirectembed),
							'orignal_url' => $urlbee,
							'pinned' => 0,
							'position' => 0,
						]);
							}		
						}						
						$emaildesign = Emaildesign::where('id', 21)->first();
						$str = ['{fullfunnel}', '{incentive}', '{url}', '{createdate}'];
						$rplc = [url('/').'/'.$ezFunnel->token, $amount, url('/').'/'.$ezFunnel->token, now()];
						$div = str_replace($str, $rplc, $emaildesign['design']);
						$mailData = ['design' => $div];
						$email = $user->email;
						try {
							$subject = "Ez.wiki Congratulations on your new funnel.";
							Mail::to(strtolower($senderEmail))->send(new Eznew($mailData, $subject));
							Mail::getSymfonyTransport()->stop();
						} catch (\Exception $e) {
							$subject = "Ez.wiki Congratulations on your new funnel.";
							@mail(strtolower($senderEmail), $subject, $div, null, 'funnel@ez.wiki');
						}
					}else{
						if(preg_match($pattern3,trim(strip_tags($body))))
							{
								$explode=explode('/',strip_tags($body));
								$embed=EzFunnel::where('token', trim($explode[1]))->first();
										if(!empty($embed))
										{
										$listofmails=explode('*',trim(strip_tags($body)));
										array_shift($listofmails);
										foreach ($listofmails as $urlbee) {
											$urlbee = trim($urlbee, " \t\n\r\0\x0B/");
					if (!empty($urlbee)) {
						if (!preg_match("~^(?:f|ht)tps?://~i", $urlbee)) {
								$urlbee = "https://" . $urlbee;
							}
		
						$aladinurlredirectembed='';
						$type='';
						$done='';
						if(isset($urlbee)){
						$parse = explode('/',$urlbee);
						if(isset($parse[3])){
						$linkdomain=$parse[0].'//'.$parse[2].'/';
						$search=$parse[3];
						$urlnew=$urlbee;
						if('tiktok.com'==get_domain($urlbee) || 'www.tiktok.com'==get_domain($urlbee)){
							$aladinurlredirectembed.='<blockquote class="tiktok-embed" cite="'.$urlbee.'" data-unique-id="melonnt" data-embed-type="creator" style="max-width: 780px; min-width: 288px;" > <section> <a target="_blank" href="'.$urlbee.'?refer=creator_embed">'.$search.'</a> </section> </blockquote> <script async src="https://www.tiktok.com/embed.js"></script>';
							$done='done';
								
							}elseif('reddit.com'==get_domain($urlbee) || 'www.reddit.com'==get_domain($urlbee)){	
							$aladinurlredirectembed.='<blockquote class="reddit-embed-bq" style="height:500px" data-embed-height="740"><a href="'.$urlbee.'"></a></blockquote><script async="" src="https://embed.reddit.com/widgets.js" charset="UTF-8"></script>';
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
						
						if(substr( $urlbee, 0, 1 ) === "<")
							{
								$aladinurlredirectembed.=$urlbee;
							}else
							{
							$urlparse = $urlbee;
							$parsed_url = parse_url($urlparse);
							if (isset($parsed_url['host'])) {
								$domain = $parsed_url['host'];
							} else {
								$domain = '';
							}
							$punycodeDomain = idn_to_ascii($domain); 
							$pndomain=str_replace($domain, $punycodeDomain, $urlbee);
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
										$aladinurlredirectembed.='<iframe loading="lazy" allow="camera; microphone; fullscreen; display-capture; autoplay" style="border: 0;" src="'.$pndomain.'" width="100%" height="888px" allowfullscreen="allowfullscreen" ></iframe>';
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
						$texth1title='2️⃣';
						if(preg_match($pattern4,trim(strip_tags($body))))
							{
								$texth1title="0️⃣";
							}
							elseif(preg_match($pattern5,trim(strip_tags($body))))
							{
								$texth1title='1️⃣';
							}
							elseif(preg_match($pattern6,trim(strip_tags($body))))
							{
								$texth1title='3️⃣';
							}
							elseif(preg_match($pattern7,trim(strip_tags($body))))
							{
								$texth1title='2️⃣';
							}elseif(preg_match($pattern10,trim(strip_tags($body))))
							{
								$texth1title='4️⃣';
							}elseif(preg_match($pattern11,trim(strip_tags($body))))
							{
								$texth1title='5️⃣';
							}elseif(preg_match($pattern8,trim(strip_tags($body))))
							{
								$texth1title='🔐';
							}
							$embedusercheck=EzFunnel::where('token', trim($explode[1]))->whereHas('user', function($query) use ($senderEmail) {
							$query->where('email', $senderEmail);
						})->first();
						if(empty($embedusercheck))
						{
							$texth1title='1️⃣';
						}
						$effect = EzFunnelField::where('ez_funnel_id', $embed->id)->get();

						foreach ($effect as $effectItem) {
							EzFunnelField::where('id', $effectItem->id)->update([
								'position' => $effectItem->position + 1,
							]);
						}
						EzFunnelField::create([
							'ez_funnel_id' => $embed->id,
							'unique_id' => null,
							'emoji_marker' => $texth1title,
							'font_size' => '9px',
							'caption' => null,
							'url' => html_entity_decode($aladinurlredirectembed),
							'orignal_url' => $urlbee,
							'pinned' => 0,
							'position' => 0,
						]);
					}	
											
										}
										$emaildesign = Emaildesign::where('id', 28)->first();
										$str = ['{url}','{updatedate}','{fullfunnel}'];
										$rplc =[url('/').'/'.$embed->token,now(),url('/').'/'.$embed->token];
										$div=str_replace($str,$rplc,$emaildesign['design']);
										$mailData = [
															'design' => $div
														];
											try{
												$subject = "Ez.wiki Your Funnel Has Been Updated!";
											   Mail::to(strtolower($senderEmail))->send(new Eznew($mailData, $subject));
											   Mail::getSymfonyTransport()->stop();
											}catch (\Exception $e){
													$subject = "Ez.wiki Your Funnel Has Been Updated!";
													
													mail(strtolower($senderEmail), $subject, $div, null,'funnel@ez.wiki');
											}
										}else
										{
											$emaildesign = Emaildesign::where('id', 29)->first();
											$str = ['{url}','{updatedate}','{funnellink}'];
											$rplc =[url('/').'/'.trim($explode[1]),now(),url('/').'/'.trim($explode[1])];
											$div=str_replace($str,$rplc,$emaildesign['design']);
											$mailData = [
																'design' => $div
															];
												try{
													$subject = "Ez.wiki Funnel Update Failed.";
												   Mail::to(strtolower($senderEmail))->send(new Eznew($mailData, $subject));
												   Mail::getSymfonyTransport()->stop();
												}catch (\Exception $e){
														$subject = "Ez.wiki Funnel Update Failed.";
														
														mail(strtolower($senderEmail), $subject, $div, null,'funnel@ez.wiki');
												}
										}
									
							}
					}
	   }
       elseif(strpos(trim(strip_tags($body)), $emoji) === 0 || preg_match($pattern,trim(strip_tags($body))) || preg_match($pattern1,trim(strip_tags($body)))) {
	   			
                    // Output the sender, all "To" emails, subject, and body
					$explode=explode('/',strip_tags($body));
					if(trim($explode[0]) === $emoji && !preg_match($pattern,trim(strip_tags($body))) && !preg_match($pattern1,trim(strip_tags($body))))
					{
						$user = User::where('email', $senderEmail)->first();
						if(empty($user)){						
						$user = User::firstOrCreate(['email' => $senderEmail]);
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
								Mail::to(strtolower($senderEmail))->send(new Eznew($mailData, $subject));
								Mail::getSymfonyTransport()->stop();
							}catch (\Exception $e){
									$subject = "Ez.wiki Your Magic Login Link";
									
									@mail($request->email, $subject, $div, null,'funnel@ez.wiki');
							}
							
						}
							$ezFunnel = EzFunnel::create([
								'user_id' => $user->id,
								'fly_sign' => 1,
								'eye_tracking' => 1,
								'seo_tag' => null,
								'theme' => '220,21',
								'color' => '#ffffff',
								'transparency' => 80,
							]);
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
						
						$texth1title='2️⃣';
						if(preg_match($pattern4,trim(strip_tags($body))))
							{
								$texth1title="0️⃣";
							}
							elseif(preg_match($pattern5,trim(strip_tags($body))))
							{
								$texth1title='1️⃣';
							}
							elseif(preg_match($pattern6,trim(strip_tags($body))))
							{
								$texth1title='3️⃣';
							}
							elseif(preg_match($pattern7,trim(strip_tags($body))))
							{
								$texth1title='2️⃣';
							}elseif(preg_match($pattern10,trim(strip_tags($body))))
							{
								$texth1title='4️⃣';
							}elseif(preg_match($pattern11,trim(strip_tags($body))))
							{
								$texth1title='5️⃣';
							}elseif(preg_match($pattern8,trim(strip_tags($body))))
							{
								$texth1title='🔐';
							}
						EzFunnelField::create([
							'ez_funnel_id' => $ezFunnel->id,
							'unique_id' => null,
							'emoji_marker' => $texth1title,
							'font_size' => '9px',
							'caption' => $subject,
							'url' => html_entity_decode($body),
							'orignal_url' => null,
							'pinned' => 0,
							'position' => 0,
						]);
						
						$emaildesign = Emaildesign::where('id', 21)->first();
						$str = ['{fullfunnel}', '{incentive}', '{url}', '{createdate}'];
						$rplc = [url('/').'/'.$ezFunnel->token, $amount, url('/').'/'.$ezFunnel->token, now()];
						$div = str_replace($str, $rplc, $emaildesign['design']);
						$mailData = ['design' => $div];
						$email = $user->email;
						try {
							$subject = "Ez.wiki Congratulations on your new funnel.";
							Mail::to(strtolower($senderEmail))->send(new Eznew($mailData, $subject));
							Mail::getSymfonyTransport()->stop();
						} catch (\Exception $e) {
							$subject = "Ez.wiki Congratulations on your new funnel.";
							@mail(strtolower($senderEmail), $subject, $div, null, 'funnel@ez.wiki');
						}
					}else{
					if(preg_match($pattern,trim(strip_tags($body))))
					{
						$embed=EzFunnel::where('token',trim($explode[1]))->first();
							if(!empty($embed))
							{
								$texth1title='2️⃣';
						if(preg_match($pattern4,trim(strip_tags($body))))
							{
								$texth1title="0️⃣";
							}
							elseif(preg_match($pattern5,trim(strip_tags($body))))
							{
								$texth1title='1️⃣';
							}
							elseif(preg_match($pattern6,trim(strip_tags($body))))
							{
								$texth1title='3️⃣';
							}
							elseif(preg_match($pattern7,trim(strip_tags($body))))
							{
								$texth1title='2️⃣';
							}elseif(preg_match($pattern10,trim(strip_tags($body))))
							{
								$texth1title='4️⃣';
							}elseif(preg_match($pattern11,trim(strip_tags($body))))
							{
								$texth1title='5️⃣';
							}elseif(preg_match($pattern8,trim(strip_tags($body))))
							{
								$texth1title='🔐';
							}
							$embedusercheck=EzFunnel::where('token', trim($explode[1]))->whereHas('user', function($query) use ($senderEmail) {
							$query->where('email', $senderEmail);
							})->first();
							if(empty($embedusercheck))
							{
								$texth1title='1️⃣';
							}
							$effect = EzFunnelField::where('ez_funnel_id', $embed->id)->get();

							foreach ($effect as $effectItem) {
								EzFunnelField::where('id', $effectItem->id)->update([
									'position' => $effectItem->position + 1,
								]);
							}
								EzFunnelField::create([
									'ez_funnel_id' => $embed->id,
									'unique_id' => null,
									'emoji_marker' => $texth1title,
									'font_size' => '9px',
									'caption' => $subject,
									'url' => html_entity_decode($body),
									'orignal_url' => null,
									'pinned' => 0,
									'position' => 0,
								]);
								$emaildesign = Emaildesign::where('id', 28)->first();
								$str = ['{url}','{updatedate}','{fullfunnel}'];
								$rplc =[url('/').'/'.$embed->token,now(),url('/').'/'.$embed->token];
								$div=str_replace($str,$rplc,$emaildesign['design']);
								$mailData = [
													'design' => $div
												];
									try{
										$subject = "Ez.wiki Your Funnel Has Been Updated!";
									   Mail::to(strtolower($senderEmail))->send(new Eznew($mailData, $subject));
									   Mail::getSymfonyTransport()->stop();
									}catch (\Exception $e){
											$subject = "Ez.wiki Your Funnel Has Been Updated!";
											
											mail(strtolower($senderEmail), $subject, $div, null,'funnel@ez.wiki');
											Mail::getSymfonyTransport()->stop();
									}
						}else
						{
							$emaildesign = Emaildesign::where('id', 29)->first();
							$str = ['{url}','{updatedate}','{funnellink}'];
							$rplc =[url('/').'/'.trim($explode[1]),now(),url('/').'/'.trim($explode[1])];
							$div=str_replace($str,$rplc,$emaildesign['design']);
							$mailData = [
												'design' => $div
											];
								try{
									$subject = "Ez.wiki Funnel Update Failed.";
								   Mail::to(strtolower($senderEmail))->send(new Eznew($mailData, $subject));
								   Mail::getSymfonyTransport()->stop();
								}catch (\Exception $e){
										$subject = "Ez.wiki Funnel Update Failed.";
										
										mail(strtolower($senderEmail), $subject, $div, null,'funnel@ez.wiki');
								}
						}
					}elseif(preg_match($pattern1,trim(strip_tags($body))))
					{
						
						$embed=EzFunnel::where('token', trim($explode[1]))->first();
							if(!empty($embed))
							{
								$texth1title='2️⃣';
						if(preg_match($pattern4,trim(strip_tags($body))))
							{
								$texth1title="0️⃣";
							}
							elseif(preg_match($pattern5,trim(strip_tags($body))))
							{
								$texth1title='1️⃣';
							}
							elseif(preg_match($pattern6,trim(strip_tags($body))))
							{
								$texth1title='3️⃣';
							}
							elseif(preg_match($pattern7,trim(strip_tags($body))))
							{
								$texth1title='2️⃣';
							}elseif(preg_match($pattern10,trim(strip_tags($body))))
							{
								$texth1title='4️⃣';
							}elseif(preg_match($pattern11,trim(strip_tags($body))))
							{
								$texth1title='5️⃣';
							}elseif(preg_match($pattern8,trim(strip_tags($body))))
							{
								$texth1title='🔐';
							}
								$embedusercheck=EzFunnel::where('token', trim($explode[1]))->whereHas('user', function($query) use ($senderEmail) {
								$query->where('email', $senderEmail);
								})->first();
								if(empty($embedusercheck))
								{
									$texth1title='1️⃣';
								}
								$effect = EzFunnelField::where('ez_funnel_id', $embed->id)->get();

								foreach ($effect as $effectItem) {
									EzFunnelField::where('id', $effectItem->id)->update([
										'position' => $effectItem->position + 1,
									]);
								}
								EzFunnelField::create([
									'ez_funnel_id' => $embed->id,
									'unique_id' => null,
									'emoji_marker' => $texth1title,
									'font_size' => '9px',
									'caption' => $subject,
									'url' => html_entity_decode($body),
									'orignal_url' => null,
									'pinned' => 1,
									'position' => 0,
								]);
								$emaildesign = Emaildesign::where('id', 28)->first();
								$str = ['{url}','{updatedate}','{fullfunnel}'];
								$rplc =[url('/').'/'.$embed->token,now(),url('/').'/'.$embed->token];
								$div=str_replace($str,$rplc,$emaildesign['design']);
								$mailData = [
													'design' => $div
												];
									try{
										$subject = "Ez.wiki Your Funnel Has Been Updated!";
									   Mail::to(strtolower($senderEmail))->send(new Eznew($mailData, $subject));
									   Mail::getSymfonyTransport()->stop();
									}catch (\Exception $e){
											$subject = "Ez.wiki Your Funnel Has Been Updated!";
											
											mail(strtolower($senderEmail), $subject, $div, null,'funnel@ez.wiki');
									}
							}else
						{
							$emaildesign = Emaildesign::where('id', 29)->first();
							$str = ['{url}','{updatedate}','{funnellink}'];
							$rplc =[url('/').'/'.trim($explode[1]),now(),url('/').'/'.trim($explode[1])];
							$div=str_replace($str,$rplc,$emaildesign['design']);
							$mailData = [
												'design' => $div
											];
								try{
									$subject = "Ez.wiki Funnel Update Failed.";
								   Mail::to(strtolower($senderEmail))->send(new Eznew($mailData, $subject));
								   Mail::getSymfonyTransport()->stop();
								}catch (\Exception $e){
										$subject = "Ez.wiki Funnel Update Failed.";
										
										mail(strtolower($senderEmail), $subject, $div, null,'funnel@ez.wiki');
								}
						}
					
					}
					}
                
	   		}
	   
        
    }
	}
	$data = array(
				   'mailuid' => $uid,
				  );
	$user = Setting::where('id',1);
	$user->update($data);
} else {
    echo "No emails found.";
}

// Close the connection
imap_close($imapStream);
	
	} 
	
}