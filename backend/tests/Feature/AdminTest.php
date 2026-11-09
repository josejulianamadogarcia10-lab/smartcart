<?php

use App\Models\CartItem;
use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

function adminToken(): string
{
    $user = User::factory()->create([
        'email' => 'admin@example.test',
        'password' => Hash::make('admin-secret'),
        'role' => 'admin',
    ]);

    return test()->postJson('/api/v1/auth/login', [
        'email' => $user->email,
        'password' => 'admin-secret',
    ])->json('access_token');
}

it('rechaza el panel admin para un token sin rol admin', function (): void {
    $user = User::factory()->create(['role' => 'customer']);
    $token = auth('api')->login($user);

    $this->withToken($token)->getJson('/api/v1/admin/products')
        ->assertForbidden()
        ->assertJsonPath('message', 'No tienes permisos de administrador.');
});

it('valida EAN único al crear productos y desactiva productos con historial', function (): void {
    $token = adminToken();
    $category = Category::factory()->create();

    $this->withToken($token)->postJson('/api/v1/admin/products', [
        'category_id' => $category->id,
        'barcode' => '1234567890123',
        'name' => 'Producto inválido',
        'price' => '10.00',
        'image_emoji' => '🛒',
    ])->assertUnprocessable()->assertJsonPath('errors.barcode.0', 'El código de barras EAN-13 no es válido.');

    $product = Product::factory()->create(['category_id' => $category, 'barcode' => '7401000000015']);
    $this->withToken($token)->postJson('/api/v1/admin/products', [
        'category_id' => $category->id,
        'barcode' => $product->barcode,
        'name' => 'Duplicado',
        'price' => '10.00',
        'image_emoji' => '🛒',
    ])->assertUnprocessable();

    CartItem::factory()->create(['product_id' => $product->id]);
    $this->withToken($token)->deleteJson('/api/v1/admin/products/'.$product->id)
        ->assertOk()->assertJsonPath('product.active', false);
    expect(Product::find($product->id))->not->toBeNull();
});

it('valida el precio y las fechas de promociones', function (): void {
    $token = adminToken();
    $product = Product::factory()->create(['price' => '20.00']);

    $this->withToken($token)->postJson('/api/v1/admin/promotions', [
        'product_id' => $product->id,
        'promo_price' => '20.00',
        'label' => 'Oferta',
        'starts_at' => now()->toDateTimeString(),
        'ends_at' => now()->subDay()->toDateTimeString(),
    ])->assertUnprocessable();

    $this->withToken($token)->postJson('/api/v1/admin/promotions', [
        'product_id' => $product->id,
        'promo_price' => '15.00',
        'label' => 'Oferta válida',
        'starts_at' => now()->toDateTimeString(),
        'ends_at' => now()->addDay()->toDateTimeString(),
    ])->assertCreated()->assertJsonPath('promotion.promo_price', '15.00');
});

it('devuelve estadísticas y compras paginadas', function (): void {
    $token = adminToken();
    $order = Order::factory()->create(['total' => '25.00', 'exit_code' => 'SC0725', 'requires_check' => true]);
    OrderItem::factory()->create(['order_id' => $order->id, 'name_snapshot' => 'Leche', 'quantity' => 2]);

    $this->withToken($token)->getJson('/api/v1/admin/stats')
        ->assertOk()->assertJsonPath('sales_total', '25.00')->assertJsonPath('orders_count', 1)
        ->assertJsonPath('top_products.0.name', 'Leche');

    $this->withToken($token)->getJson('/api/v1/admin/orders')
        ->assertOk()->assertJsonPath('data.0.exit_code', 'SC0725')
        ->assertJsonPath('data.0.requires_check', true);
});

it('devuelve el detalle de compra solo a administradores', function (): void {
    $order = Order::factory()->create(['subtotal' => '10.00', 'vat' => '1.20', 'total' => '11.20']);
    OrderItem::factory()->create(['order_id' => $order->id, 'name_snapshot' => 'Leche', 'quantity' => 2, 'line_total' => '11.20']);

    $customer = User::factory()->create(['role' => 'customer']);
    $customerToken = auth('api')->login($customer);
    $this->withToken($customerToken)->getJson('/api/v1/admin/orders/'.$order->id)->assertForbidden();

    $admin = User::factory()->create(['role' => 'admin']);
    $this->withToken(auth('api')->login($admin))->getJson('/api/v1/admin/orders/'.$order->id)
        ->assertOk()->assertJsonPath('order.items.0.name_snapshot', 'Leche')
        ->assertJsonPath('order.total', '11.20');
});

it('permite promociones sin vigencia cuando las fechas son null', function (): void {
    $product = Product::factory()->create(['price' => '20.00']);

    $this->withToken(adminToken())->postJson('/api/v1/admin/promotions', [
        'product_id' => $product->id,
        'promo_price' => '15.00',
        'label' => 'Oferta sin vigencia',
        'starts_at' => null,
        'ends_at' => null,
    ])->assertCreated()->assertJsonPath('promotion.starts_at', null)
        ->assertJsonPath('promotion.ends_at', null);
});
