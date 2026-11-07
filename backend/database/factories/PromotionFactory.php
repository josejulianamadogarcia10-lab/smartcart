<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\Promotion;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Promotion> */
class PromotionFactory extends Factory
{
    protected $model = Promotion::class;

    public function definition(): array
    {
        return [
            'product_id' => Product::factory(),
            'promo_price' => fake()->randomFloat(2, 1, 80),
            'label' => 'Oferta demo',
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addDay(),
            'active' => true,
        ];
    }
}
