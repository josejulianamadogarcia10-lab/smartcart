<?php

namespace Database\Factories;

use App\Models\Device;
use App\Models\ShoppingSession;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<ShoppingSession> */
class ShoppingSessionFactory extends Factory
{
    protected $model = ShoppingSession::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'device_id' => Device::factory(),
            'status' => 'active',
            'budget' => null,
            'started_at' => now(),
            'finished_at' => null,
        ];
    }
}
