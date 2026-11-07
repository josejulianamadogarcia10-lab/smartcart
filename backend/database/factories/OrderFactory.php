<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\ShoppingSession;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Order> */
class OrderFactory extends Factory
{
    protected $model = Order::class;

    public function definition(): array
    {
        return [
            'shopping_session_id' => ShoppingSession::factory(),
            'invoice_type' => 'CF',
            'nit' => null,
            'subtotal' => 8.93,
            'vat' => 1.07,
            'total' => 10,
            'payment_method' => 'card',
            'status' => 'paid',
            'requires_check' => false,
            'exit_code' => fake()->unique()->bothify('SC-######'),
        ];
    }
}
