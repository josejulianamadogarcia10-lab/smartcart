<?php

namespace App\Services;

use App\Models\CartItem;
use App\Models\Promotion;
use App\Models\ShoppingSession;
use Illuminate\Database\DatabaseManager;
use Illuminate\Validation\ValidationException;

class PromotionService
{
    public function __construct(private readonly DatabaseManager $database) {}

    public function offers(ShoppingSession $session): array
    {
        $session->loadMissing('cartItems.product');
        $cartProductIds = $session->cartItems->pluck('product_id')->all();
        $categoryIds = $session->cartItems->pluck('product.category_id')->filter()->unique()->all();
        $now = now();

        $promotions = Promotion::with('product.category')
            ->where('active', true)
            ->whereHas('product', fn ($query) => $query->where('active', true))
            ->where(fn ($query) => $query->whereNull('starts_at')->orWhere('starts_at', '<=', $now))
            ->where(fn ($query) => $query->whereNull('ends_at')->orWhere('ends_at', '>=', $now))
            ->whereNotIn('product_id', $cartProductIds ?: [0])
            ->get()
            ->sortBy(fn (Promotion $promotion): array => [
                in_array($promotion->product->category_id, $categoryIds, true) ? 0 : 1,
                $promotion->id,
            ])
            ->take(3);

        return $promotions->map(fn (Promotion $promotion): array => [
            'id' => $promotion->id,
            'name' => $promotion->product->name,
            'emoji' => $promotion->product->image_emoji,
            'category' => $promotion->product->category->name,
            'original_price' => (string) $promotion->product->price,
            'promo_price' => (string) $promotion->promo_price,
            'saving' => $this->saving((string) $promotion->product->price, (string) $promotion->promo_price),
            'label' => $promotion->label,
        ])->values()->all();
    }

    public function add(ShoppingSession $session, int $promotionId): CartItem
    {
        return $this->database->transaction(function () use ($session, $promotionId): CartItem {
            $lockedSession = ShoppingSession::whereKey($session->id)->lockForUpdate()->firstOrFail();
            $now = now();
            $promotion = Promotion::with('product')
                ->whereKey($promotionId)
                ->where('active', true)
                ->whereHas('product', fn ($query) => $query->where('active', true))
                ->where(fn ($query) => $query->whereNull('starts_at')->orWhere('starts_at', '<=', $now))
                ->where(fn ($query) => $query->whereNull('ends_at')->orWhere('ends_at', '>=', $now))
                ->lockForUpdate()
                ->first();

            if (! $promotion) {
                abort(404, 'La oferta no está disponible.');
            }

            $existing = CartItem::where('shopping_session_id', $lockedSession->id)
                ->where('product_id', $promotion->product_id)
                ->lockForUpdate()
                ->exists();

            if ($existing) {
                throw ValidationException::withMessages([
                    'promotion' => 'Este producto ya está en tu carrito.',
                ]);
            }

            return CartItem::create([
                'shopping_session_id' => $lockedSession->id,
                'product_id' => $promotion->product_id,
                'quantity' => 1,
                'unit_price' => $promotion->promo_price,
                'promo_applied' => true,
            ]);
        });
    }

    private function saving(string $original, string $promo): string
    {
        [$originalWhole, $originalFraction] = array_pad(explode('.', $original, 2), 2, '0');
        [$promoWhole, $promoFraction] = array_pad(explode('.', $promo, 2), 2, '0');
        $originalCents = (int) $originalWhole * 100 + (int) str_pad($originalFraction, 2, '0');
        $promoCents = (int) $promoWhole * 100 + (int) str_pad($promoFraction, 2, '0');
        $savingCents = $originalCents - $promoCents;

        return sprintf('%d.%02d', intdiv($savingCents, 100), $savingCents % 100);
    }
}
