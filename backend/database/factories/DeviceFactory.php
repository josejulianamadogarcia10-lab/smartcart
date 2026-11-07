<?php

namespace Database\Factories;

use App\Models\Device;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Device> */
class DeviceFactory extends Factory
{
    protected $model = Device::class;

    public function definition(): array
    {
        return ['code' => 'CART-'.fake()->unique()->numberBetween(1, 99), 'name' => 'Carrito demo', 'active' => true];
    }
}
