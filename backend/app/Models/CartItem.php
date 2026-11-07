<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CartItem extends Model
{
    use HasFactory;

    protected $fillable = ['shopping_session_id', 'product_id', 'quantity', 'unit_price', 'promo_applied'];

    protected function casts(): array
    {
        return ['unit_price' => 'decimal:2', 'promo_applied' => 'boolean'];
    }

    public function shoppingSession(): BelongsTo
    {
        return $this->belongsTo(ShoppingSession::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
