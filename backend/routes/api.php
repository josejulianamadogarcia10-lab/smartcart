<?php

use App\Http\Controllers\Api\V1\AuthController;
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
});
