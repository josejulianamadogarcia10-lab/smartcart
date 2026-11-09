<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\ShoppingSession;
use Illuminate\Database\DatabaseManager;
use Illuminate\Validation\ValidationException;

class CheckoutService
{
    public function __construct(
        private readonly DatabaseManager $database,
        private readonly PricingService $pricingService,
    ) {}

    public function checkout(ShoppingSession $session, array $data): Order
    {
        return $this->database->transaction(function () use ($session, $data): Order {
            $lockedSession = ShoppingSession::with('cartItems.product')
                ->whereKey($session->id)
                ->lockForUpdate()
                ->firstOrFail();

            $existingOrder = $lockedSession->order()->first();

            if ($existingOrder && $existingOrder->status !== 'failed') {
                throw ValidationException::withMessages(['checkout' => 'Esta sesión ya tiene un pago registrado.']);
            }

            if ($lockedSession->status !== 'active') {
                throw ValidationException::withMessages(['checkout' => 'Esta sesión ya no está activa.']);
            }

            if ($lockedSession->cartItems->isEmpty()) {
                throw ValidationException::withMessages(['checkout' => 'No puedes pagar un carrito vacío.']);
            }

            $totalCents = $lockedSession->cartItems->sum(fn ($item): int => $this->toCents((string) $item->unit_price) * $item->quantity);
            $pricing = $this->pricingService->calculate($this->fromCents($totalCents));
            $isDemo = (bool) config('app.demo_mode', false);
            $simulateFailure = $isDemo && (bool) ($data['simulate_failure'] ?? false) && $data['payment_method'] === 'card';
            $requiresCheck = $isDemo && (bool) ($data['force_check'] ?? false)
                ? true
                : $this->requiresCheck($isDemo);
            $paymentFailed = $simulateFailure;
            $status = $paymentFailed ? 'failed' : ($data['payment_method'] === 'fast_checkout' ? 'pending_cashier' : 'paid');
            $exitCode = $this->uniqueExitCode();

            $order = $existingOrder ?? Order::create([
                'shopping_session_id' => $lockedSession->id,
                'invoice_type' => strtoupper($data['invoice_type']),
                'nit' => strtoupper($data['invoice_type']) === 'NIT' ? $data['nit'] : null,
                'subtotal' => $pricing['subtotal'],
                'vat' => $pricing['vat'],
                'total' => $pricing['total'],
                'payment_method' => $data['payment_method'],
                'status' => $status,
                'requires_check' => $requiresCheck,
                'exit_code' => $exitCode,
            ]);

            if ($existingOrder) {
                $order->update([
                    'invoice_type' => strtoupper($data['invoice_type']),
                    'nit' => strtoupper($data['invoice_type']) === 'NIT' ? $data['nit'] : null,
                    'subtotal' => $pricing['subtotal'],
                    'vat' => $pricing['vat'],
                    'total' => $pricing['total'],
                    'payment_method' => $data['payment_method'],
                    'status' => $status,
                    'requires_check' => $requiresCheck,
                ]);
                $order->items()->delete();
            }

            foreach ($lockedSession->cartItems as $item) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $item->product_id,
                    'name_snapshot' => $item->product->name,
                    'unit_price' => $item->unit_price,
                    'quantity' => $item->quantity,
                    'line_total' => $this->fromCents($this->toCents((string) $item->unit_price) * $item->quantity),
                ]);
            }

            Payment::create([
                'order_id' => $order->id,
                'method' => $data['payment_method'],
                'status' => $paymentFailed ? 'failed' : ($status === 'pending_cashier' ? 'pending' : 'approved'),
                'simulated' => true,
                'reference' => $paymentFailed ? null : 'SIM-'.str_pad((string) $order->id, 6, '0', STR_PAD_LEFT),
            ]);

            if (! $paymentFailed) {
                $lockedSession->update(['status' => 'paid', 'finished_at' => now()]);
            }

            return $order->load(['items', 'payment', 'shoppingSession']);
        });
    }

    private function requiresCheck(bool $isDemo): bool
    {
        if (! $isDemo) {
            return false;
        }

        return random_int(0, 10000) < (int) round((float) config('app.exit_check_probability', 0.2) * 10000);
    }

    private function uniqueExitCode(): string
    {
        for ($attempt = 0; $attempt < 10; $attempt++) {
            $code = 'SC'.str_pad((string) random_int(0, 9999), 4, '0', STR_PAD_LEFT);

            if (! Order::where('exit_code', $code)->exists()) {
                return $code;
            }
        }

        throw new \RuntimeException('No fue posible generar un código de salida único.');
    }

    private function toCents(string $amount): int
    {
        [$whole, $fraction] = array_pad(explode('.', $amount, 2), 2, '0');

        return (int) $whole * 100 + (int) str_pad($fraction, 2, '0');
    }

    private function fromCents(int $cents): string
    {
        return sprintf('%d.%02d', intdiv($cents, 100), $cents % 100);
    }
}
