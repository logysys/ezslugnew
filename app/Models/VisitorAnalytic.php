<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VisitorAnalytic extends Model
{
    // If you named your table differently, define it here:
    // protected $table = 'visitor_analytics';

    protected $fillable = [
        'user_id',
        'funnel_id',
        'ip_address',
        'method',
        'url',
        'referer',
        'user_agent',
        'location_data',
    ];

    protected $casts = [
        'location_data' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function funnel()
    {
        return $this->belongsTo(EzFunnel::class, 'funnel_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the count of visits for a specific slug or message share URL
     *
     * @param string|null $slug
     * @return int
     */
    public static function getVisitsCountForSlug(?string $slug): int
    {
        if (empty($slug)) {
            return 0;
        }

        return self::where(function ($query) use ($slug) {
            $query->where('url', 'like', '%/' . $slug . '%')
                  ->orWhere('url', 'like', '%/X/' . $slug . '%')
                  ->orWhere('url', 'like', '%/ai-search/' . $slug . '%')
                  ->orWhere('url', 'like', '%search=' . $slug . '%');
        })->count();
    }

    /**
     * Get visit counts for multiple slugs in a single query
     *
     * @param array $slugs
     * @return array<string, int>
     */
    public static function getVisitsCountForSlugs(array $slugs): array
    {
        $result = [];
        foreach ($slugs as $slug) {
            if (!empty($slug)) {
                $result[$slug] = self::getVisitsCountForSlug($slug);
            }
        }
        return $result;
    }
}