<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\ScanRequest;
use App\Http\Requests\Api\V1\UpdateCartItemRequest;
use App\Models\CartItem;
use App\Models\ShoppingSession;
use App\Services\CartService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class SessionController extends Controller
{
    public function __construct(private readonly CartService $cartService) {}

    public function store(): JsonResponse
    {
        $deviceCode = JWTAuth::parseToken()->getPayload()->get('device');

        if (! is_string($deviceCode) || $deviceCode === '') {
            return response()->json(['message' => 'El token no identifica un carrito.'], 422);
        }

        $session = $this->cartService->start(auth('api')->id(), $deviceCode);

        return response()->json($this->cartService->representation($session), 201);
    }

    public function current(): JsonResponse
    {
        $session = $this->cartService->current(auth('api')->id());

        if (! $session) {
            return response()->json(['message' => 'No tienes una sesión de compra activa.'], 404);
        }

        $this->authorizeSession('view', $session);

        return response()->json($this->cartService->representation($session));
    }

    public function scan(ScanRequest $request): JsonResponse
    {
        $session = $this->currentSession();
        $result = $this->cartService->scan(
            $session,
            $request->string('barcode')->toString(),
            $request->string('source')->toString(),
        );

        if (($result['error'] ?? null) === 'invalid') {
            throw ValidationException::withMessages(['barcode' => 'El código de barras no es un EAN-13 válido.']);
        }

        if (($result['error'] ?? null) === 'not_found') {
            throw new NotFoundHttpException('Este producto no está en el catálogo');
        }

        return response()->json([
            'session' => $this->cartService->representation($result['session'], $result['item_id']),
            'scan' => [
                'result' => $result['result'],
                'message' => $result['result'] === 'added' ? 'Producto agregado al carrito.' : 'Cantidad actualizada.',
            ],
        ]);
    }

    public function update(UpdateCartItemRequest $request, CartItem $item): JsonResponse
    {
        $session = $this->currentSession();
        $this->authorizeSession('update', $session);
        $session = $this->cartService->updateQuantity($session, $item, $request->integer('quantity'));

        return response()->json($this->cartService->representation($session));
    }

    public function destroy(CartItem $item): JsonResponse
    {
        $session = $this->currentSession();
        $this->authorizeSession('update', $session);
        $session = $this->cartService->removeItem($session, $item);

        return response()->json($this->cartService->representation($session));
    }

    private function currentSession(): ShoppingSession
    {
        $session = $this->cartService->current(auth('api')->id());

        abort_if(! $session, 404, 'No tienes una sesión de compra activa.');
        $this->authorizeSession('view', $session);

        return $session;
    }

    private function authorizeSession(string $ability, ShoppingSession $session): void
    {
        Gate::forUser(auth('api')->user())->authorize($ability, $session);
    }
}
