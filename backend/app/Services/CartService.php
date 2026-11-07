<?php

namespace App\Services;

use App\Models\CartItem;
use App\Models\Device;
use App\Models\Product;
use App\Models\ScanEvent;
use App\Models\ShoppingSession;
use App\Support\Ean13;
use Illuminate\Database\DatabaseManager;
use Illuminate\Validation\ValidationException;

class CartService
{
    public function __construct(private readonly DatabaseManager $database) {}

    public function start(int $userId, string $deviceCode, ?string $budget = null): ShoppingSession
    {
        return $this->database->transaction(function () use ($userId, $deviceCode, $budget): ShoppingSession {
            $device = Device::where('code', $deviceCode)->where('active', true)->lockForUpdate()->firstOrFail();

            ShoppingSession::where('device_id', $device->id)
                ->where('status', 'active')
                ->update(['status' => 'cancelled', 'finished_at' => now()]);

            return ShoppingSession::create([
                'user_id' => $userId,
                'device_id' => $device->id,
                'status' => 'active',
                'budget' => $budget,
                'started_at' => now(),
            ]);
        });
    }

    public function updateBudget(ShoppingSession $session, ?string $budget): ShoppingSession
    {
        $session->update(['budget' => $budget]);

        return $session->load(['cartItems.product.category', 'device']);
    }

    public function current(int $userId): ?ShoppingSession
    {
        return ShoppingSession::where('user_id', $userId)
            ->where('status', 'active')
            ->with(['cartItems.product.category', 'device'])
            ->latest('id')
            ->first();
    }

    public function scan(ShoppingSession $session, string $barcode, string $source): array
    {
        return $this->database->transaction(function () use ($session, $barcode, $source): array {
            $lockedSession = ShoppingSession::whereKey($session->id)->lockForUpdate()->firstOrFail();

            if (! Ean13::isValid($barcode)) {
                $this->recordScan($lockedSession, $barcode, 'invalid', $source);

                return ['error' => 'invalid'];
            }

            $product = Product::where('barcode', $barcode)->where('active', true)->first();

            if (! $product) {
                $this->recordScan($lockedSession, $barcode, 'not_found', $source);

                return ['error' => 'not_found'];
            }

            $item = CartItem::where('shopping_session_id', $lockedSession->id)
                ->where('product_id', $product->id)
                ->lockForUpdate()
                ->first();

            $currentQuantity = $item?->quantity ?? 0;

            if ($currentQuantity >= 99) {
                throw ValidationException::withMessages(['quantity' => 'La cantidad máxima por línea es 99 unidades.']);
            }

            if ($item) {
                $item->increment('quantity');
                $item->refresh();
                $result = 'incremented';
            } else {
                $promotion = $product->promotions()
                    ->where('active', true)
                    ->where(fn ($query) => $query->whereNull('starts_at')->orWhere('starts_at', '<=', now()))
                    ->where(fn ($query) => $query->whereNull('ends_at')->orWhere('ends_at', '>=', now()))
                    ->latest('id')
                    ->first();

                $item = CartItem::create([
                    'shopping_session_id' => $lockedSession->id,
                    'product_id' => $product->id,
                    'quantity' => 1,
                    'unit_price' => $promotion?->promo_price ?? $product->price,
                    'promo_applied' => $promotion !== null,
                ]);
                $result = 'added';
            }

            $this->recordScan($lockedSession, $barcode, $result, $source);

            $lockedSession->load(['cartItems.product.category', 'device']);

            return ['session' => $lockedSession, 'item_id' => $item->id, 'result' => $result];
        });
    }

    public function updateQuantity(ShoppingSession $session, CartItem $item, int $quantity): ShoppingSession
    {
        $this->assertItemBelongsToSession($session, $item);
        $item->update(['quantity' => $quantity]);

        return $session->load(['cartItems.product.category', 'device']);
    }

    public function removeItem(ShoppingSession $session, CartItem $item): ShoppingSession
    {
        $this->assertItemBelongsToSession($session, $item);
        $item->delete();

        return $session->load(['cartItems.product.category', 'device']);
    }

    public function representation(ShoppingSession $session, ?int $newItemId = null): array
    {
        $session->loadMissing(['cartItems.product.category', 'device']);
        $totalCents = 0;
        $itemsCount = 0;
        $items = [];

        foreach ($session->cartItems as $item) {
            $lineTotalCents = $this->toCents((string) $item->unit_price) * $item->quantity;
            $totalCents += $lineTotalCents;
            $itemsCount += $item->quantity;
            $items[] = [
                'id' => $item->id,
                'product' => [
                    'name' => $item->product->name,
                    'category' => $item->product->category->name,
                    'emoji' => $item->product->image_emoji,
                ],
                'quantity' => $item->quantity,
                'unit_price' => (string) $item->unit_price,
                'line_total' => $this->fromCents($lineTotalCents),
                'promo_applied' => $item->promo_applied,
                'is_new' => $newItemId !== null && $item->id === $newItemId,
            ];
        }

        $pricing = app(PricingService::class)->calculate($this->fromCents($totalCents));

        $budget = $this->budgetRepresentation($session->budget, $totalCents);

        return [
            'id' => $session->id,
            'status' => $session->status,
            'items' => $items,
            'totals' => [
                'items_count' => $itemsCount,
                'subtotal' => $pricing['subtotal'],
                'vat' => $pricing['vat'],
                'total' => $pricing['total'],
            ],
            'budget' => $budget,
        ];
    }

    private function recordScan(ShoppingSession $session, string $barcode, string $result, string $source): void
    {
        ScanEvent::create([
            'shopping_session_id' => $session->id,
            'barcode' => substr($barcode, 0, 13),
            'result' => $result,
            'source' => $source,
            'created_at' => now(),
        ]);
    }

    private function assertItemBelongsToSession(ShoppingSession $session, CartItem $item): void
    {
        abort_unless($item->shopping_session_id === $session->id, 403, 'Este producto no pertenece a tu sesión.');
    }

    private function toCents(string $amount): int
    {
        [$whole, $fraction] = array_pad(explode('.', $amount, 2), 2, '0');

        return (int) $whole * 100 + (int) str_pad($fraction, 2, '0');
    }

    private function fromCents(int $cents): string
    {
        $sign = $cents < 0 ? '-' : '';
        $absolute = abs($cents);

        return sprintf('%s%d.%02d', $sign, intdiv($absolute, 100), $absolute % 100);
    }

    private function budgetRepresentation(?string $budget, int $totalCents): array
    {
        if ($budget === null) {
            return ['amount' => null, 'used_percent' => 0, 'remaining' => null, 'level' => 'none'];
        }

        $budgetCents = $this->toCents($budget);
        $usedPercent = intdiv($totalCents * 100, $budgetCents);
        $warnRatio = $this->decimalRatio((string) config('cart.budget_warn', '0.8'));
        $level = $totalCents >= $budgetCents
            ? 'exceeded'
            : ($totalCents * $warnRatio[1] >= $budgetCents * $warnRatio[0] ? 'warning' : 'ok');

        return [
            'amount' => $this->fromCents($budgetCents),
            'used_percent' => $usedPercent,
            'remaining' => $this->fromCents($budgetCents - $totalCents),
            'level' => $level,
        ];
    }

    /** @return array{0:int,1:int} */
    private function decimalRatio(string $value): array
    {
        [$whole, $fraction] = array_pad(explode('.', $value, 2), 2, '');
        $fraction = rtrim($fraction, '0');
        $denominator = 10 ** strlen($fraction);

        return [(int) $whole * $denominator + (int) ($fraction === '' ? 0 : $fraction), $denominator];
    }
}
