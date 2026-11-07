<?php

use App\Models\Device;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    Device::create(['code' => 'CART-07', 'name' => 'Carrito 07', 'active' => true]);
    User::create([
        'name' => 'Cliente demo',
        'email' => 'cliente@smartcart.test',
        'password' => Hash::make('secreto'),
        'role' => 'customer',
        'qr_code' => 'SC-DEMO-0001',
    ]);
});

it('creates a guest token with role and device claims', function (): void {
    $response = $this->postJson('/api/v1/auth/guest', ['device_code' => 'CART-07']);

    $response->assertOk()
        ->assertJsonPath('token_type', 'bearer')
        ->assertJsonPath('user.role', 'guest');

    $payload = JWTAuth::setToken($response->json('access_token'))->getPayload();

    expect($payload->get('role'))->toBe('guest')
        ->and($payload->get('device'))->toBe('CART-07');
});

it('rejects guest and QR authentication for an unknown or inactive device', function (): void {
    Device::create(['code' => 'CART-08', 'name' => 'Carrito 08', 'active' => false]);

    $this->postJson('/api/v1/auth/guest', ['device_code' => 'NO-EXISTE'])
        ->assertStatus(422)
        ->assertJsonPath('errors.device_code.0', 'El carrito no existe o está inactivo.');

    $this->postJson('/api/v1/auth/qr', [
        'qr_code' => 'SC-DEMO-0001',
        'device_code' => 'CART-08',
    ])->assertStatus(422);
});

it('authenticates a customer through QR', function (): void {
    $response = $this->postJson('/api/v1/auth/qr', [
        'qr_code' => 'SC-DEMO-0001',
        'device_code' => 'CART-07',
    ]);

    $response->assertOk()->assertJsonPath('user.qr_code', 'SC-DEMO-0001');
});

it('rejects an unknown QR code and incorrect credentials', function (): void {
    $this->postJson('/api/v1/auth/qr', [
        'qr_code' => 'QR-INVALIDO',
        'device_code' => 'CART-07',
    ])->assertUnauthorized();

    $this->postJson('/api/v1/auth/login', [
        'email' => 'cliente@smartcart.test',
        'password' => 'incorrecta',
    ])->assertUnauthorized()->assertJsonPath('message', 'Las credenciales son incorrectas.');
});

it('authenticates with login and protects the me endpoint', function (): void {
    $response = $this->postJson('/api/v1/auth/login', [
        'email' => 'cliente@smartcart.test',
        'password' => 'secreto',
        'device_code' => 'CART-07',
    ])->assertOk();

    $this->withHeader('Authorization', 'Bearer '.$response->json('access_token'))
        ->getJson('/api/v1/auth/me')
        ->assertOk()
        ->assertJsonPath('user.email', 'cliente@smartcart.test');
});

it('rejects absent and invalid tokens', function (): void {
    $this->getJson('/api/v1/auth/me')->assertUnauthorized();

    $this->withHeader('Authorization', 'Bearer token-invalido')
        ->getJson('/api/v1/auth/me')
        ->assertUnauthorized();
});

it('rejects an expired token', function (): void {
    $token = $this->postJson('/api/v1/auth/login', [
        'email' => 'cliente@smartcart.test',
        'password' => 'secreto',
    ])->json('access_token');

    $this->travel(31)->minutes();

    $this->withHeader('Authorization', 'Bearer '.$token)
        ->getJson('/api/v1/auth/me')
        ->assertUnauthorized();
});

it('refreshes a valid token and refuses a token after logout', function (): void {
    $token = $this->postJson('/api/v1/auth/login', [
        'email' => 'cliente@smartcart.test',
        'password' => 'secreto',
    ])->json('access_token');

    $this->withHeader('Authorization', 'Bearer '.$token)
        ->postJson('/api/v1/auth/refresh')
        ->assertOk()
        ->assertJsonStructure(['access_token', 'expires_in', 'user']);

    $this->withHeader('Authorization', 'Bearer '.$token)
        ->postJson('/api/v1/auth/logout')
        ->assertOk();

    $this->withHeader('Authorization', 'Bearer '.$token)
        ->postJson('/api/v1/auth/refresh')
        ->assertUnauthorized();
});

it('limits login to five attempts per minute', function (): void {
    foreach (range(1, 5) as $attempt) {
        $this->postJson('/api/v1/auth/login', [
            'email' => 'cliente@smartcart.test',
            'password' => "incorrecta-$attempt",
        ])->assertUnauthorized();
    }

    $this->postJson('/api/v1/auth/login', [
        'email' => 'cliente@smartcart.test',
        'password' => 'incorrecta-6',
    ])->assertTooManyRequests();
});
