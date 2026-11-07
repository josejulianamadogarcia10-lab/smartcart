<?php

namespace Database\Factories;

use App\Models\ScanEvent;
use App\Models\ShoppingSession;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<ScanEvent> */
class ScanEventFactory extends Factory
{
    protected $model = ScanEvent::class;

    public function definition(): array
    {
        return [
            'shopping_session_id' => ShoppingSession::factory(),
            'barcode' => fake()->numerify('740##########'),
            'result' => 'added',
            'source' => 'simulation',
            'created_at' => now(),
        ];
    }
}
