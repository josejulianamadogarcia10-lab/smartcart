<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\AdminProductRequest;
use App\Http\Requests\Api\V1\AdminPromotionRequest;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Promotion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class AdminController extends Controller
{
    public function products(): JsonResponse
    {
        return response()->json(['products' => Product::with('category')->orderBy('name')->get()]);
    }

    public function storeProduct(AdminProductRequest $request): JsonResponse
    {
        $product = Product::create($request->validated());

        return response()->json(['product' => $product->load('category')], 201);
    }

    public function updateProduct(AdminProductRequest $request, Product $product): JsonResponse
    {
        $product->update($request->validated());

        return response()->json(['product' => $product->refresh()->load('category')]);
    }

    public function destroyProduct(Product $product): JsonResponse
    {
        if ($product->cartItems()->exists()) {
            $product->update(['active' => false]);

            return response()->json(['message' => 'El producto tiene historial y fue desactivado.', 'product' => $product->refresh()]);
        }

        $product->delete();

        return response()->json(['message' => 'Producto eliminado.']);
    }

    public function promotions(): JsonResponse
    {
        return response()->json(['promotions' => Promotion::with('product')->latest()->get()]);
    }

    public function storePromotion(AdminPromotionRequest $request): JsonResponse
    {
        $data = $request->validated();
        $product = Product::findOrFail($data['product_id']);
        $this->ensurePromoPrice($data['promo_price'], (string) $product->price);
        $promotion = Promotion::create($data);

        return response()->json(['promotion' => $promotion->load('product')], 201);
    }

    public function updatePromotion(AdminPromotionRequest $request, Promotion $promotion): JsonResponse
    {
        $data = $request->validated();
        $product = Product::findOrFail($data['product_id']);
        $this->ensurePromoPrice($data['promo_price'], (string) $product->price);
        $promotion->update($data);

        return response()->json(['promotion' => $promotion->refresh()->load('product')]);
    }

    public function destroyPromotion(Promotion $promotion): JsonResponse
    {
        $promotion->update(['active' => false]);

        return response()->json(['message' => 'Promoción desactivada.', 'promotion' => $promotion->refresh()]);
    }

    public function orders(Request $request): JsonResponse
    {
        $orders = Order::with(['shoppingSession.user', 'items'])->latest()->paginate(15);

        return response()->json($orders);
    }

    public function order(Order $order): JsonResponse
    {
        return response()->json(['order' => $order->load('items')]);
    }

    public function stats(): JsonResponse
    {
        $paid = Order::whereIn('status', ['paid', 'pending_cashier']);

        return response()->json([
            'sales_total' => $this->formatMoney((string) $paid->sum('total')),
            'orders_count' => (clone $paid)->count(),
            'top_products' => OrderItem::query()
                ->selectRaw('name_snapshot as name, SUM(quantity) as quantity')
                ->groupBy('name_snapshot')->orderByDesc('quantity')->limit(5)->get(),
        ]);
    }

    private function ensurePromoPrice(string|int|float $promoPrice, string $normalPrice): void
    {
        if ($this->toCents((string) $promoPrice) >= $this->toCents($normalPrice)) {
            throw ValidationException::withMessages(['promo_price' => 'El precio de oferta debe ser menor al precio normal.']);
        }
    }

    private function toCents(string $amount): int
    {
        $parts = array_pad(explode('.', $amount, 2), 2, '00');
        $whole = $parts[0];
        $fraction = $parts[1];

        return ((int) $whole * 100) + (int) str_pad(substr($fraction, 0, 2), 2, '0');
    }

    private function formatMoney(string $amount): string
    {
        $cents = $this->toCents($amount);

        return intdiv($cents, 100).'.'.str_pad((string) ($cents % 100), 2, '0', STR_PAD_LEFT);
    }
}
