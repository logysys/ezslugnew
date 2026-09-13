<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Defaultpage extends Model
{
    use HasFactory;

    protected $fillable = ['handle_id', 'domain_id'];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
    
    public function handle()
    {
        return $this->belongsTo(EzFunnel::class, 'handle_id');
    }

    public function domain()
    {
        return $this->belongsTo(Admindomain::class, 'domain_id');
    }
}