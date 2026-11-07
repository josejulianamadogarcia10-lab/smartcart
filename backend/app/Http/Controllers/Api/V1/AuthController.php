<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\GuestRequest;
use App\Http\Requests\Api\V1\LoginRequest;
use App\Http\Requests\Api\V1\QrRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    public function guest(GuestRequest $request): JsonResponse
    {
        $user = User::create([
            'name' => 'Invitado',
            'role' => 'guest',
        ]);

        return $this->tokenResponse($user, $request->string('device_code')->toString());
    }

    public function qr(QrRequest $request): JsonResponse
    {
        $user = User::where('qr_code', $request->string('qr_code')->toString())
            ->where('role', 'customer')
            ->first();

        if (! $user) {
            return response()->json(['message' => 'El código QR no es válido.'], 401);
        }

        return $this->tokenResponse($user, $request->string('device_code')->toString());
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = $request->only('email', 'password');
        $user = User::where('email', $credentials['email'])->first();

        if (! $user || ! password_verify($credentials['password'], (string) $user->password)) {
            return response()->json(['message' => 'Las credenciales son incorrectas.'], 401);
        }

        return $this->tokenResponse($user, $request->input('device_code'));
    }

    public function refresh(): JsonResponse
    {
        $token = auth('api')->refresh();
        $user = auth('api')->user();

        return $this->response($token, $user);
    }

    public function logout(): JsonResponse
    {
        auth('api')->logout();

        return response()->json(['message' => 'La sesión se cerró correctamente.']);
    }

    public function me(): JsonResponse
    {
        return response()->json(['user' => auth('api')->user()]);
    }

    private function tokenResponse(User $user, ?string $deviceCode): JsonResponse
    {
        $claims = ['role' => $user->role];

        if ($deviceCode !== null && $deviceCode !== '') {
            $claims['device'] = $deviceCode;
        }

        $token = JWTAuth::claims($claims)->fromUser($user);

        return $this->response($token, $user);
    }

    private function response(string $token, User $user): JsonResponse
    {
        return response()->json([
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => (int) config('jwt.ttl') * 60,
            'user' => $user,
        ]);
    }
}
