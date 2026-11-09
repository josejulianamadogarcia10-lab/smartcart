<?php

use App\Http\Controllers\Api\V1\AdminController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\SessionController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::prefix('auth')->group(function (): void {
        Route::post('guest', [AuthController::class, 'guest']);
        Route::post('qr', [AuthController::class, 'qr']);
        Route::post('login', [AuthController::class, 'login'])->middleware('throttle:5,1');
        Route::middleware('auth:api')->group(function (): void {
            Route::post('refresh', [AuthController::class, 'refresh']);
            Route::post('logout', [AuthController::class, 'logout']);
            Route::get('me', [AuthController::class, 'me']);
        });
    });

    Route::middleware('auth:api')->group(function (): void {
        Route::post('sessions', [SessionController::class, 'store']);
        Route::get('sessions/current', [SessionController::class, 'current']);
        Route::put('sessions/current/budget', [SessionController::class, 'budget']);
        Route::get('sessions/current/offers', [SessionController::class, 'offers']);
        Route::post('sessions/current/offers/{promotion}/add', [SessionController::class, 'addOffer']);
        Route::get('sessions/current/summary', [SessionController::class, 'summary']);
        Route::post('sessions/current/checkout', [SessionController::class, 'checkout']);
        Route::get('orders/{order}/exit', [SessionController::class, 'exit']);
        Route::post('sessions/current/scan', [SessionController::class, 'scan']);
        Route::patch('sessions/current/items/{item}', [SessionController::class, 'update']);
        Route::delete('sessions/current/items/{item}', [SessionController::class, 'destroy']);
    });

    Route::middleware(['auth:api', 'admin'])->prefix('admin')->group(function (): void {
        Route::get('products', [AdminController::class, 'products']);
        Route::post('products', [AdminController::class, 'storeProduct']);
        Route::put('products/{product}', [AdminController::class, 'updateProduct']);
        Route::delete('products/{product}', [AdminController::class, 'destroyProduct']);
        Route::get('promotions', [AdminController::class, 'promotions']);
        Route::post('promotions', [AdminController::class, 'storePromotion']);
        Route::put('promotions/{promotion}', [AdminController::class, 'updatePromotion']);
        Route::delete('promotions/{promotion}', [AdminController::class, 'destroyPromotion']);
        Route::get('orders', [AdminController::class, 'orders']);
        Route::get('orders/{order}', [AdminController::class, 'order']);
        Route::get('stats', [AdminController::class, 'stats']);
    });
});
