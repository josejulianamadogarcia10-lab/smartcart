<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Device extends Model
{
    use HasFactory;

    protected $fillable = ['code', 'name', 'last_seen_at', 'active'];

    protected function casts(): array
    {
        return ['last_seen_at' => 'datetime', 'active' => 'boolean'];
    }

    public function shoppingSessions(): HasMany
    {
        return $this->hasMany(ShoppingSession::class);
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'shopping_sessions');
    }
}
