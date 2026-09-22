<?php

namespace App\Http\Controllers;

use App\Models\Customdomain;
use App\Models\Domain;
use App\Models\EzFunnel;
use App\Models\HandleTransfer;
use App\Models\Frontpage;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class HandleTransferController extends Controller
{
    public function index()
    {
        $template = Frontpage::where('frontpages.id', 1)
            ->join('templates', 'frontpages.theme_id', '=', 'templates.id')
            ->select('templates.*')
            ->first();
            
        $funnels = EzFunnel::where('user_id', auth()->id())
            ->with(['fields', 'customDomains', 'handleDomains'])
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return Inertia::render('eztransfer', [
            'template' => $template,
            'auth' => ['user' => auth()->user() ?? null],
            'initialFunnels' => $funnels,
        ]);
    }

    public function transferHistory()
    {
        $template = Frontpage::where('frontpages.id', 1)
            ->join('templates', 'frontpages.theme_id', '=', 'templates.id')
            ->select('templates.*')
            ->first();

        $sentTransfers = HandleTransfer::with(['recipient', 'handle'])
            ->where('user_id', auth()->id())
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($transfer) {
                return [
                    'id' => $transfer->id,
                    'token' => $transfer->token,
                    'handle_type' => $transfer->handle_type,
                    'handle_name' => $transfer->handle_name,
                    'handle_url' => $transfer->handle_url,
                    'created_at' => $transfer->created_at,
                    'transferred_at' => $transfer->transferred_at,
                    'used' => $transfer->used,
                    'recipient' => $transfer->recipient,
                    'expires_at' => $transfer->expires_at,
                ];
            });

        $receivedTransfers = HandleTransfer::with(['sender', 'handle'])
            ->where('recipient_id', auth()->id())
            ->orderBy('transferred_at', 'desc')
            ->get()
            ->map(function ($transfer) {
                return [
                    'id' => $transfer->id,
                    'token' => $transfer->token,
                    'handle_type' => $transfer->handle_type,
                    'handle_name' => $transfer->handle_name,
                    'handle_url' => $transfer->handle_url,
                    'created_at' => $transfer->created_at,
                    'transferred_at' => $transfer->transferred_at,
                    'used' => $transfer->used,
                    'sender' => $transfer->sender,
                    'expires_at' => $transfer->expires_at,
                ];
            });

        return Inertia::render('transferhistory', [
            'template' => $template,
            'sentTransfers' => $sentTransfers,
            'receivedTransfers' => $receivedTransfers,
            'auth' => ['user' => auth()->user() ?? null],
        ]);
    }

    public function generateToken(Request $request)
    {
        $request->validate([
            'type' => 'required|in:custom,domain',
            'handle_id' => 'required|integer'
        ]);

        if ($request->type === 'custom') {
            $handle = Customdomain::where('id', $request->handle_id)
                ->where('user_id', auth()->id())
                ->firstOrFail();
            $handleName = "https://{$handle->domainselected}/{$handle->domain}";
        } else {
            $handle = Domain::where('id', $request->handle_id)
                ->where('user_id', auth()->id())
                ->firstOrFail();
            $handleName = "https://{$handle->domain}.{$handle->domainselected}";
        }

        $transfer = HandleTransfer::create([
            'user_id' => auth()->id(),
            'token' => Str::random(32),
            'handle_type' => $request->type,
            'handle_id' => $request->handle_id,
            'handle_name' => $handleName,
            'expires_at' => now()->addDays(7)
        ]);

        return response()->json([
            'token' => $transfer->token,
            'expires_at' => $transfer->expires_at->format('Y-m-d H:i:s')
        ]);
    }

    public function redeemToken(Request $request)
    {
        $request->validate([
            'token' => 'required|string|size:32',
            'funnel_id' => 'nullable|integer|exists:ez_funnels,id,user_id,' . auth()->id()
        ]);

        $transfer = HandleTransfer::where('token', $request->token)
            ->where('used', false)
            ->where('expires_at', '>', now())
            ->firstOrFail();

        if ($transfer->handle_type === 'custom') {
            $handle = Customdomain::findOrFail($transfer->handle_id);
        } else {
            $handle = Domain::findOrFail($transfer->handle_id);
        }

        if ($request->filled('funnel_id')) {
            $handle->update([
                'user_id' => auth()->id(),
                'funnelid' => $request->funnel_id
            ]);
        } else {
            $originalFunnel = EzFunnel::find($handle->funnelid);
            
            $funnel = EzFunnel::create([
                'user_id' => auth()->id(),
                'theme' => $originalFunnel->theme ?? 'default',
                'color' => $originalFunnel->color ?? '#5d0f6e',
                'transparency' => $originalFunnel->transparency ?? 0,
                'mode' => $originalFunnel->mode ?? 'light',
                'fly_sign' => $originalFunnel->fly_sign ?? null,
                'eye_tracking' => $originalFunnel->eye_tracking ?? null,
                'seo_tag' => $originalFunnel->seo_tag ?? null
            ]);

            if ($originalFunnel->fields()->exists()) {
                foreach ($originalFunnel->fields as $field) {
                    $funnel->fields()->create($field->toArray());
                }
            }

            if ($originalFunnel->effectSettings()->exists()) {
                foreach ($originalFunnel->effectSettings as $effect) {
                    $funnel->effectSettings()->create($effect->toArray());
                }
            }

            if ($originalFunnel->seoSettings()->exists()) {
                $seoSettings = $originalFunnel->seoSettings->toArray();
                unset($seoSettings['id']);
                $funnel->seoSettings()->create($seoSettings);
            }

            if ($originalFunnel->logoSettings()->exists()) {
                $logoSettings = $originalFunnel->logoSettings->toArray();
                unset($logoSettings['id']);
                $funnel->logoSettings()->create($logoSettings);
            }

            $handle->update([
                'user_id' => auth()->id(),
                'funnelid' => $funnel->id
            ]);
        }

        $transfer->update([
            'used' => true,
            'recipient_id' => auth()->id(),
            'transferred_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Handle transferred successfully!',
            'handle' => $transfer->handle_name,
            'funnel_id' => $handle->funnelid,
            'is_new_funnel' => !$request->has('funnel_id')
        ]);
    }

}