<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'shopping_session_id', 'invoice_type', 'nit', 'subtotal', 'vat', 'total',
        'payment_method', 'status', 'requires_check', 'exit_code',
    ];

    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'vat' => 'decimal:2',
            'total' => 'decimal:2',
            'requires_check' => 'boolean',
        ];
    }

    public function shoppingSession(): BelongsTo
    {
        return $this->belongsTo(ShoppingSession::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function payment(): HasOne
    {
        return $this->hasOne(Payment::class)->latestOfMany();
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }
}
