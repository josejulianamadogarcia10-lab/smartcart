<?php

use App\Models\Category;
use App\Models\Device;
use App\Models\Product;
use App\Models\Promotion;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    putenv('SEED_ADMIN_PASSWORD=seed-test-password');
    $_ENV['SEED_ADMIN_PASSWORD'] = 'seed-test-password';
    $_SERVER['SEED_ADMIN_PASSWORD'] = 'seed-test-password';
});

it('seeds the demo catalog and users with valid EAN-13 codes', function (): void {
    $this->artisan('db:seed')->assertExitCode(0);

    expect(Category::count())->toBe(7)
        ->and(Device::where('code', 'CART-07')->value('name'))->toBe('Carrito 07')
        ->and(Product::count())->toBe(20)
        ->and(Promotion::count())->toBe(3)
        ->and(User::where('email', 'admin@smartcart.test')->value('role'))->toBe('admin')
        ->and(User::where('qr_code', 'SC-DEMO-0001')->value('role'))->toBe('customer');

    Product::pluck('barcode')->each(function (string $barcode): void {
        expect($barcode)->toMatch('/^\d{13}$/');

        $digits = array_map('intval', str_split($barcode));
        $sum = array_sum(array_map(
            fn (int $index): int => $digits[$index] * (in_array($index, [1, 3, 5, 7, 9, 11], true) ? 3 : 1),
            range(0, 11),
        ));

        expect((10 - ($sum % 10)) % 10)->toBe($digits[12]);
    });
});

it('can be run repeatedly without duplicating demo records', function (): void {
    $this->artisan('db:seed')->assertExitCode(0);
    $this->artisan('db:seed')->assertExitCode(0);

    expect(Category::count())->toBe(7)
        ->and(Device::count())->toBe(1)
        ->and(Product::count())->toBe(20)
        ->and(Promotion::count())->toBe(3)
        ->and(User::where('email', 'admin@smartcart.test')->count())->toBe(1)
        ->and(User::where('qr_code', 'SC-DEMO-0001')->count())->toBe(1);
});
