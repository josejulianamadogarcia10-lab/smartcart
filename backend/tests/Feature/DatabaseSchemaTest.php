<?php

use App\Models\CartItem;
use App\Models\Category;
use App\Models\Device;
use App\Models\Product;
use App\Models\ShoppingSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('persiste una compra y sus relaciones principales', function (): void {
    $user = User::factory()->create(['role' => 'guest']);
    $device = Device::factory()->create();
    $category = Category::factory()->create();
    $product = Product::factory()->create([
        'category_id' => $category->id,
        'price' => 11.75,
    ]);
    $session = ShoppingSession::factory()->create([
        'user_id' => $user->id,
        'device_id' => $device->id,
        'budget' => 100,
    ]);

    $item = CartItem::factory()->create([
        'shopping_session_id' => $session->id,
        'product_id' => $product->id,
        'unit_price' => $product->price,
    ]);

    expect($session->user->is($user))->toBeTrue()
        ->and($session->device->is($device))->toBeTrue()
        ->and($session->cartItems->first()->is($item))->toBeTrue()
        ->and($item->product->price)->toBe('11.75');
});
