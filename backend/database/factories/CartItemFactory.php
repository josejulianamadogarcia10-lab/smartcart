<?php

namespace Database\Factories;

use App\Models\CartItem;
use App\Models\Product;
use App\Models\ShoppingSession;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<CartItem> */
class CartItemFactory extends Factory
{
    protected $model = CartItem::class;

    public function definition(): array
    {
        return [
            'shopping_session_id' => ShoppingSession::factory(),
            'product_id' => Product::factory(),
            'quantity' => 1,
            'unit_price' => 10,
            'promo_applied' => false,
        ];
    }
}
