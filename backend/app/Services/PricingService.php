<?php

namespace App\Services;

use InvalidArgumentException;

final class PricingService
{
    private const VAT_RATE = 12;

    /**
     * Calculate VAT included in a total using integer cents only.
     *
     * @return array{total: string, vat: string, subtotal: string}
     */
    public function calculate(string $total): array
    {
        $totalCents = $this->toCents($total);
        $vatCents = $this->roundHalfUp($totalCents * self::VAT_RATE, 100 + self::VAT_RATE);
        $subtotalCents = $totalCents - $vatCents;

        return [
            'total' => $this->fromCents($totalCents),
            'vat' => $this->fromCents($vatCents),
            'subtotal' => $this->fromCents($subtotalCents),
        ];
    }

    private function toCents(string $amount): int
    {
        if (! preg_match('/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/', $amount)) {
            throw new InvalidArgumentException('El monto debe ser un número no negativo con hasta dos decimales.');
        }

        [$whole, $fraction] = array_pad(explode('.', $amount, 2), 2, '0');

        return (int) $whole * 100 + (int) str_pad($fraction, 2, '0');
    }

    private function fromCents(int $cents): string
    {
        return sprintf('%d.%02d', intdiv($cents, 100), $cents % 100);
    }

    private function roundHalfUp(int $numerator, int $denominator): int
    {
        $quotient = intdiv($numerator, $denominator);
        $remainder = $numerator % $denominator;

        return $quotient + ($remainder * 2 >= $denominator ? 1 : 0);
    }
}
