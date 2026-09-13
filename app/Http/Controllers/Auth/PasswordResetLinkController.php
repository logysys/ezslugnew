<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use App\Models\Frontpage;
use App\Models\Tooltip;
use Inertia\Inertia;
use Inertia\Response;

class PasswordResetLinkController extends Controller
{
    /**
     * Show the password reset link request page.
     */
    public function create(Request $request): Response
    {
		$template = Frontpage::where('frontpages.id', 2)
            ->join('templates', 'frontpages.theme_id', '=', 'templates.id')
            ->select('templates.*')
            ->first();
		$tooltips = Tooltip::all()->mapWithKeys(function ($tooltip) {
        // Decode the JSON tooltips array and convert to key-value pairs
			$tooltipArray = json_decode($tooltip->tooltips, true);
			return [$tooltip->reference => $tooltipArray];
		});
        return Inertia::render('auth/forgot-password', [
            'status' => $request->session()->get('status'),
			'tooltips' => $tooltips,
			'template' => $template
        ]);
    }

    /**
     * Handle an incoming password reset link request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        Password::sendResetLink(
            $request->only('email')
        );

        return back()->with('status', __('A reset link will be sent if the account exists.'));
    }
}
