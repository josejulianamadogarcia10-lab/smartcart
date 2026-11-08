<?php

use App\Models\CartItem;
use App\Models\Category;
use App\Models\Device;
use App\Models\Order;
use App\Models\Product;
use App\Models\ShoppingSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    config()->set('app.demo_mode', true);
    $category = Category::create(['name' => 'Despensa', 'color_hex' => '#14b8a6', 'emoji' => '🛒']);
    $this->device = Device::create(['code' => 'CART-07', 'name' => 'Carrito 07', 'active' => true]);
    $this->product = Product::create([
        'category_id' => $category->id,
        'barcode' => '7401000000015',
        'name' => 'Leche entera 1 litro',
        'price' => '11.75',
        'image_emoji' => '🥛',
        'active' => true,
    ]);
    $this->user = User::create(['name' => 'Cliente', 'email' => 'checkout@smartcart.test', 'password' => Hash::make('secreto'), 'role' => 'customer']);
});

function checkoutToken(User $user): string
{
    return JWTAuth::claims(['role' => $user->role, 'device' => 'CART-07'])->fromUser($user);
}

function checkoutSession($test, int $quantity = 1): ShoppingSession
{
    $token = checkoutToken($test->user);
    $test->withToken($token)->postJson('/api/v1/sessions')->assertCreated();
    $session = ShoppingSession::where('user_id', $test->user->id)->firstOrFail();
    CartItem::create(['shopping_session_id' => $session->id, 'product_id' => $test->product->id, 'quantity' => $quantity, 'unit_price' => '11.75']);

    return $session;
}

it('recalcula y crea orden, partidas, pago y sesión pagada', function (): void {
    checkoutSession($this);
    $token = checkoutToken($this->user);

    $response = $this->withToken($token)->postJson('/api/v1/sessions/current/checkout', [
        'invoice_type' => 'CF',
        'payment_method' => 'card',
        'force_check' => true,
    ]);

    $response->assertCreated()
        ->assertJsonPath('order.invoice_type', 'CF')
        ->assertJsonPath('order.subtotal', '10.49')
        ->assertJsonPath('order.vat', '1.26')
        ->assertJsonPath('order.total', '11.75')
        ->assertJsonPath('order.status', 'paid')
        ->assertJsonPath('order.requires_check', true)
        ->assertJsonPath('order.payment.status', 'approved')
        ->assertJsonPath('order.items.0.name_snapshot', 'Leche entera 1 litro');

    expect(Order::count())->toBe(1)
        ->and(ShoppingSession::firstOrFail()->status)->toBe('paid')
        ->and(Order::firstOrFail()->exit_code)->toMatch('/^SC\d{4}$/');
});

it('acepta CF en minúsculas y NIT válido, pero rechaza NIT inválido', function (): void {
    checkoutSession($this);
    $token = checkoutToken($this->user);

    $this->withToken($token)->postJson('/api/v1/sessions/current/checkout', [
        'invoice_type' => 'nit',
        'nit' => '123456-9',
        'payment_method' => 'card',
    ])->assertStatus(422)->assertJsonPath('errors.nit.0', 'El NIT no es válido.');

    $this->withToken($token)->postJson('/api/v1/sessions/current/checkout', [
        'invoice_type' => 'nit',
        'nit' => '123456-0',
        'payment_method' => 'card',
    ])->assertCreated()->assertJsonPath('order.invoice_type', 'NIT')->assertJsonPath('order.nit', '123456-0');
});

it('rechaza carrito vacío y un segundo pago', function (): void {
    $token = checkoutToken($this->user);
    $this->withToken($token)->postJson('/api/v1/sessions')->assertCreated();
    $this->withToken($token)->postJson('/api/v1/sessions/current/checkout', ['invoice_type' => 'CF', 'payment_method' => 'card'])
        ->assertStatus(422)->assertJsonPath('errors.checkout.0', 'No puedes pagar un carrito vacío.');

    checkoutSession($this);
    $payload = ['invoice_type' => 'CF', 'payment_method' => 'card'];
    $this->withToken($token)->postJson('/api/v1/sessions/current/checkout', $payload)->assertCreated();
    $this->withToken($token)->postJson('/api/v1/sessions/current/checkout', $payload)
        ->assertStatus(422)
        ->assertJsonPath('errors.checkout.0', 'Esta sesión ya tiene un pago registrado.');
    expect(Order::count())->toBe(1);
});

it('conserva activa la sesión y registra pago fallido simulado', function (): void {
    checkoutSession($this);
    $token = checkoutToken($this->user);

    $this->withToken($token)->postJson('/api/v1/sessions/current/checkout', [
        'invoice_type' => 'CF',
        'payment_method' => 'card',
        'simulate_failure' => true,
    ])->assertStatus(422)->assertJsonPath('order.status', 'failed');

    expect(ShoppingSession::firstOrFail()->status)->toBe('active')
        ->and(Order::firstOrFail()->payment->status)->toBe('failed');
});

it('marca caja rápida como pendiente de cajero y protege la salida', function (): void {
    checkoutSession($this);
    $token = checkoutToken($this->user);
    $response = $this->withToken($token)->postJson('/api/v1/sessions/current/checkout', [
        'invoice_type' => 'CF',
        'payment_method' => 'fast_checkout',
    ])->assertCreated()->assertJsonPath('order.status', 'pending_cashier');
    $orderId = $response->json('order.id');

    $this->withToken($token)->getJson("/api/v1/orders/{$orderId}/exit")
        ->assertOk()->assertJsonStructure(['exit_code', 'requires_check']);

    $other = User::create(['name' => 'Ajeno', 'role' => 'customer']);
    $this->actingAs($other, 'api')->getJson("/api/v1/orders/{$orderId}/exit")->assertForbidden();
});
