<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],
    
    'stripe' => [
        'key' => env('STRIPE_KEY'),
        'secret' => env('STRIPE_SECRET'),
    ],
    
    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect' => env('GOOGLE_REDIRECT_URI'),
    ],
    
    'linkedin-openid' => [
        'client_id' => env('LINKEDIN_OPENID_CLIENT_ID'),
        'client_secret' => env('LINKEDIN_OPENID_CLIENT_SECRET'),
        'redirect' => env('LINKEDIN_OPENID_REDIRECT_URI'),
    ],
    
    'reddit' => [
        'client_id' => env('REDDIT_CLIENT_ID'),
        'client_secret' => env('REDDIT_CLIENT_SECRET'),
        'redirect' => env('REDDIT_REDIRECT_URI'),
    ],
    
    'moonshot' => [
        'api_key' => env('MOONSHOT_API_KEY'),
        'model' => env('MOONSHOT_MODEL', 'kimi-k3'),
        'temperature' => env('MOONSHOT_TEMPERATURE', 0.6),
        'max_tokens' => env('MOONSHOT_MAX_TOKENS', 2000),
        'base_url' => env('MOONSHOT_BASE_URL', 'https://api.moonshot.ai/v1'),
        'timeout' => env('MOONSHOT_TIMEOUT', 60),
    ],
	
	'openai' => [
        'api_key' => env('OPENAI_API_KEY'),
        'model' => env('OPENAI_MODEL', 'gpt-4o-mini'),
        'temperature' => env('OPENAI_TEMPERATURE', 0.6),
        'max_tokens' => env('OPENAI_MAX_TOKENS', 2000),
        'base_url' => env('OPENAI_BASE_URL', 'https://api.openai.com/v1'),
        'timeout' => env('OPENAI_TIMEOUT', 60),
    ],
	
	'deepseek' => [
        'api_key' => env('DEEPSEEK_API_KEY'),
        'base_url' => env('DEEPSEEK_BASE_URL', 'https://api.deepseek.com/v1'),
        'model' => env('DEEPSEEK_MODEL', 'deepseek-chat'),
        'temperature' => env('DEEPSEEK_TEMPERATURE', 0.6),
        'max_tokens' => env('DEEPSEEK_MAX_TOKENS', 2000),
        'timeout' => env('DEEPSEEK_TIMEOUT', 60),
    ],
	
	'perplexity' => [
		'api_key' => env('PERPLEXITY_API_KEY'),
		'base_url' => env('PERPLEXITY_BASE_URL', 'https://api.perplexity.ai'),
		'model' => env('PERPLEXITY_MODEL', 'sonar-pro'), // Using sonar-pro as default
		'temperature' => env('PERPLEXITY_TEMPERATURE', 0.6),
		'max_tokens' => env('PERPLEXITY_MAX_TOKENS', 2000),
		'timeout' => env('PERPLEXITY_TIMEOUT', 60),
	],
    
	'gemini' => [
		'api_key' => env('GEMINI_API_KEY'),
		'base_url' => env('GEMINI_BASE_URL', 'https://generativelanguage.googleapis.com/v1beta'),
		'model' => env('GEMINI_MODEL', 'gemini-3-flash-preview'),
		'temperature' => env('GEMINI_TEMPERATURE', 0.6),
		'max_tokens' => env('GEMINI_MAX_TOKENS', 2000),
		'timeout' => env('GEMINI_TIMEOUT', 60),
	],
	
];