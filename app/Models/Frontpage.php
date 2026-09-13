<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Frontpage extends Model
{
    use HasFactory;

    protected $fillable = ['page', 'type', 'handle_id', 'theme_id', 'domain_id'];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
    
    public function template()
    {
        return $this->belongsTo(Template::class, 'theme_id');
    }
    
    public function handle()
    {
        return $this->belongsTo(EzFunnel::class, 'handle_id');
    }

    public function domain()
    {
        return $this->belongsTo(Admindomain::class, 'domain_id');
    }
}