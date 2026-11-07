<?php

use App\Models\CartItem;
use App\Models\Category;
use App\Models\Device;
use App\Models\Product;
use App\Models\Promotion;
use App\Models\ScanEvent;
use App\Models\ShoppingSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->category = Category::create(['name' => 'Despensa', 'color_hex' => '#14b8a6', 'emoji' => '🛒']);
    $this->device = Device::create(['code' => 'CART-07', 'name' => 'Carrito 07', 'active' => true]);
    $this->product = Product::create([
        'category_id' => $this->category->id,
        'barcode' => '7401000000015',
        'name' => 'Leche entera 1 litro',
        'price' => '11.75',
        'image_emoji' => '🥛',
        'active' => true,
    ]);
    $this->promoProduct = Product::create([
        'category_id' => $this->category->id,
        'barcode' => '7401000000022',
        'name' => 'Queso fresco 400 g',
        'price' => '28.00',
        'image_emoji' => '🧀',
        'active' => true,
    ]);
    Promotion::create([
        'product_id' => $this->promoProduct->id,
        'promo_price' => '20.00',
        'label' => 'Oferta demo',
        'active' => true,
    ]);
    $this->user = User::create([
        'name' => 'Cliente uno',
        'email' => 'uno@smartcart.test',
        'password' => Hash::make('secreto'),
        'role' => 'customer',
    ]);
});

function sessionToken(User $user, string $device = 'CART-07'): string
{
    return JWTAuth::claims(['role' => $user->role, 'device' => $device])->fromUser($user);
}

it('starts a session and returns an empty response with budget none', function (): void {
    $response = $this->withToken(sessionToken($this->user))->postJson('/api/v1/sessions');

    $response->assertCreated()
        ->assertJsonPath('status', 'active')
        ->assertJsonPath('items', [])
        ->assertJsonPath('totals.items_count', 0)
        ->assertJsonPath('totals.total', '0.00')
        ->assertJsonPath('budget.level', 'none');
});

it('accepts a budget when starting a session and calculates its progress', function (): void {
    $token = sessionToken($this->user);
    $this->withToken($token)->postJson('/api/v1/sessions', ['budget' => '100.00'])
        ->assertCreated()
        ->assertJsonPath('budget.amount', '100.00')
        ->assertJsonPath('budget.used_percent', 0)
        ->assertJsonPath('budget.level', 'ok');

    $session = ShoppingSession::where('user_id', $this->user->id)->firstOrFail();
    CartItem::create(['shopping_session_id' => $session->id, 'product_id' => $this->product->id, 'quantity' => 1, 'unit_price' => '80.00']);

    $this->withToken($token)->getJson('/api/v1/sessions/current')
        ->assertOk()
        ->assertJsonPath('budget.used_percent', 80)
        ->assertJsonPath('budget.remaining', '20.00')
        ->assertJsonPath('budget.level', 'warning');
});

it('marks a budget as exceeded at 100 percent without blocking scanning', function (): void {
    $token = sessionToken($this->user);
    $this->withToken($token)->postJson('/api/v1/sessions', ['budget' => '100.00'])->assertCreated();
    $session = ShoppingSession::where('user_id', $this->user->id)->firstOrFail();
    CartItem::create(['shopping_session_id' => $session->id, 'product_id' => $this->product->id, 'quantity' => 1, 'unit_price' => '100.00']);

    $this->withToken($token)->getJson('/api/v1/sessions/current')
        ->assertJsonPath('budget.used_percent', 100)
        ->assertJsonPath('budget.level', 'exceeded');

    $this->withToken($token)->postJson('/api/v1/sessions/current/scan', [
        'barcode' => $this->promoProduct->barcode,
        'source' => 'simulation',
    ])->assertOk()->assertJsonPath('scan.result', 'added');
});

it('updates or clears the budget and rejects non-positive values', function (): void {
    $token = sessionToken($this->user);
    $this->withToken($token)->postJson('/api/v1/sessions')->assertCreated();

    $this->withToken($token)->putJson('/api/v1/sessions/current/budget', ['budget' => '50.00'])
        ->assertOk()->assertJsonPath('budget.amount', '50.00');
    $this->withToken($token)->putJson('/api/v1/sessions/current/budget', ['budget' => null])
        ->assertOk()->assertJsonPath('budget.level', 'none');
    $this->withToken($token)->putJson('/api/v1/sessions/current/budget', ['budget' => '0'])
        ->assertStatus(422)->assertJsonPath('errors.budget.0', 'El presupuesto debe ser mayor que Q0.00.');
});

it('cancels the previous active session on the same device', function (): void {
    $first = ShoppingSession::create([
        'user_id' => $this->user->id,
        'device_id' => $this->device->id,
        'status' => 'active',
        'started_at' => now(),
    ]);

    $secondUser = User::create(['name' => 'Cliente dos', 'role' => 'customer']);
    $this->withToken(sessionToken($secondUser))->postJson('/api/v1/sessions')->assertCreated();

    expect($first->fresh()->status)->toBe('cancelled')
        ->and(ShoppingSession::where('device_id', $this->device->id)->where('status', 'active')->count())->toBe(1);
});

it('adds a product, freezes the active promotion price and marks only the new item', function (): void {
    $token = sessionToken($this->user);
    $this->withToken($token)->postJson('/api/v1/sessions')->assertCreated();

    $response = $this->withToken($token)->postJson('/api/v1/sessions/current/scan', [
        'barcode' => $this->promoProduct->barcode,
        'source' => 'simulation',
    ]);

    $response->assertOk()
        ->assertJsonPath('scan.result', 'added')
        ->assertJsonPath('session.items.0.unit_price', '20.00')
        ->assertJsonPath('session.items.0.promo_applied', true)
        ->assertJsonPath('session.items.0.is_new', true)
        ->assertJsonPath('session.totals.total', '20.00');

    expect(CartItem::first()->unit_price)->toBe('20.00');
});

it('increments the same item safely and records scan events', function (): void {
    $token = sessionToken($this->user);
    $this->withToken($token)->postJson('/api/v1/sessions')->assertCreated();

    $payload = ['barcode' => $this->product->barcode, 'source' => 'reader'];
    $this->withToken($token)->postJson('/api/v1/sessions/current/scan', $payload)->assertOk();
    $response = $this->withToken($token)->postJson('/api/v1/sessions/current/scan', $payload);

    $response->assertOk()
        ->assertJsonPath('scan.result', 'incremented')
        ->assertJsonPath('session.items.0.quantity', 2)
        ->assertJsonPath('session.items.0.is_new', true);

    expect(ScanEvent::where('result', 'added')->count())->toBe(1)
        ->and(ScanEvent::where('result', 'incremented')->count())->toBe(1);
});

it('marks only the last scanned product as new', function (): void {
    $token = sessionToken($this->user);
    $this->withToken($token)->postJson('/api/v1/sessions')->assertCreated();

    $this->withToken($token)->postJson('/api/v1/sessions/current/scan', [
        'barcode' => $this->product->barcode,
        'source' => 'simulation',
    ])->assertOk();

    $response = $this->withToken($token)->postJson('/api/v1/sessions/current/scan', [
        'barcode' => $this->promoProduct->barcode,
        'source' => 'simulation',
    ]);

    $response->assertOk()
        ->assertJsonPath('session.items.0.is_new', false)
        ->assertJsonPath('session.items.1.is_new', true);
});

it('returns 422 for malformed EAN and records invalid', function (): void {
    $token = sessionToken($this->user);
    $this->withToken($token)->postJson('/api/v1/sessions')->assertCreated();

    $this->withToken($token)
        ->postJson('/api/v1/sessions/current/scan', ['barcode' => '123456789012', 'source' => 'reader'])
        ->assertStatus(422)
        ->assertJsonPath('errors.barcode.0', 'El código de barras no es un EAN-13 válido.');

    expect(ScanEvent::where('result', 'invalid')->count())->toBe(1);
});

it('returns 404 for an unknown product and records not found', function (): void {
    $token = sessionToken($this->user);
    $this->withToken($token)->postJson('/api/v1/sessions')->assertCreated();

    $this->withToken($token)
        ->postJson('/api/v1/sessions/current/scan', ['barcode' => '7401000000039', 'source' => 'simulation'])
        ->assertNotFound()
        ->assertJsonPath('message', 'Este producto no está en el catálogo');

    expect(ScanEvent::where('result', 'not_found')->count())->toBe(1);
});

it('rejects invalid sources and quantities over 99', function (): void {
    $token = sessionToken($this->user);
    $this->withToken($token)->postJson('/api/v1/sessions')->assertCreated();

    $this->withToken($token)
        ->postJson('/api/v1/sessions/current/scan', ['barcode' => $this->product->barcode, 'source' => 'manual'])
        ->assertStatus(422);

    $session = ShoppingSession::where('user_id', $this->user->id)->firstOrFail();
    $item = CartItem::create([
        'shopping_session_id' => $session->id,
        'product_id' => $this->product->id,
        'quantity' => 99,
        'unit_price' => '11.75',
    ]);

    $this->withToken($token)
        ->postJson('/api/v1/sessions/current/scan', ['barcode' => $this->product->barcode, 'source' => 'reader'])
        ->assertStatus(422)
        ->assertJsonPath('errors.quantity.0', 'La cantidad máxima por línea es 99 unidades.');

    expect($item->fresh()->quantity)->toBe(99);
});

it('updates and removes only items from the authenticated session', function (): void {
    $token = sessionToken($this->user);
    $this->withToken($token)->postJson('/api/v1/sessions')->assertCreated();
    $session = ShoppingSession::where('user_id', $this->user->id)->firstOrFail();
    $item = CartItem::create([
        'shopping_session_id' => $session->id,
        'product_id' => $this->product->id,
        'quantity' => 1,
        'unit_price' => '11.75',
    ]);

    $this->withToken($token)
        ->patchJson("/api/v1/sessions/current/items/{$item->id}", ['quantity' => 3])
        ->assertOk()
        ->assertJsonPath('items.0.quantity', 3);

    $this->withToken($token)
        ->deleteJson("/api/v1/sessions/current/items/{$item->id}")
        ->assertOk()
        ->assertJsonPath('items', []);
});

it('does not allow one user to modify another user session item', function (): void {
    $firstToken = sessionToken($this->user);
    $this->withToken($firstToken)->postJson('/api/v1/sessions')->assertCreated();
    $session = ShoppingSession::where('user_id', $this->user->id)->firstOrFail();
    $item = CartItem::create([
        'shopping_session_id' => $session->id,
        'product_id' => $this->product->id,
        'quantity' => 1,
        'unit_price' => '11.75',
    ]);

    $other = User::create(['name' => 'Cliente ajeno', 'role' => 'customer']);
    $otherToken = sessionToken($other);
    $this->withToken($otherToken)->postJson('/api/v1/sessions')->assertCreated();

    $this->withToken($otherToken)
        ->patchJson("/api/v1/sessions/current/items/{$item->id}", ['quantity' => 2])
        ->assertForbidden();

    expect($item->fresh()->quantity)->toBe(1);
});
