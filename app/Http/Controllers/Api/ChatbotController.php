<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Faq;
use App\Models\DomainTransferRule;

class ChatbotController extends Controller
{
    public function chat(Request $request)
    {
        $message = strtolower($request->input('message'));

        // 2. Handle FAQ
        $faq = $this->matchFaq($message);
        if ($faq) {
            return response()->json([
                'type' => 'faq',
                'answer' => $faq->answer
            ]);
        }
		
		// 1. Detect intent
        if ($message) {
            $msg=$this->handleDomainTransfer($message);
			if ($msg) {
				return $msg;
			}
        }


        // 3. Fallback
        return response()->json([
            'type' => 'fallback',
            'answer' => 'Sorry, I could not find an exact answer. Please contact support.'
        ]);
    }

    private function matchFaq(string $message)
    {
        $faqs = Faq::where('is_active', true)->get();

        foreach ($faqs as $faq) {
            foreach ($faq->keywords ?? [] as $keyword) {
                if (str_contains($message, strtolower($keyword))) {
                    return $faq;
                }
            }
        }

        return null;
    }

    private function handleDomainTransfer(string $message)
    {
        $rules = DomainTransferRule::all();

        foreach ($rules as $rule) {
            foreach ($rule->keywords as $keyword) {
                if (str_contains($message, strtolower($keyword))) {
                    return response()->json([
                        'type' => 'domain_transfer',
                        'provider' => $rule->provider_name,
                        'steps' => $rule->steps,
                        'support_url' => $rule->support_url
                    ]);
                }
            }
        }

    }
}
