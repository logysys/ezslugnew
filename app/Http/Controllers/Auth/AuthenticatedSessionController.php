<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use App\Models\Frontpage;
use App\Models\Tooltip;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Show the login page.
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
		
		return Inertia::render('auth/login', [
			'canResetPassword' => Route::has('password.request'),
			'template' => $template,
			'tooltips' => $tooltips,
			'status' => $request->session()->get('status'),
		]);
	}

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
