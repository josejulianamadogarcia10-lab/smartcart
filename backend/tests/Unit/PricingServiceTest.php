<?php

use App\Services\PricingService;

it('calculates IVA incluido para Q85.25', function (): void {
    expect(app(PricingService::class)->calculate('85.25'))->toBe([
        'total' => '85.25',
        'vat' => '9.13',
        'subtotal' => '76.12',
    ]);
});

it('calculates IVA incluido para Q70.25', function (): void {
    expect(app(PricingService::class)->calculate('70.25'))->toBe([
        'total' => '70.25',
        'vat' => '7.53',
        'subtotal' => '62.72',
    ]);
});

it('handles zero total', function (): void {
    expect(app(PricingService::class)->calculate('0.00'))->toBe([
        'total' => '0.00',
        'vat' => '0.00',
        'subtotal' => '0.00',
    ]);
});

it('rounds a half cent up without floating point arithmetic', function (): void {
    expect(app(PricingService::class)->calculate('0.14'))->toBe([
        'total' => '0.14',
        'vat' => '0.02',
        'subtotal' => '0.12',
    ]);
});

it('keeps subtotal plus IVA equal to total after rounding', function (string $total): void {
    $result = app(PricingService::class)->calculate($total);
    $sumInCents = (int) str_replace('.', '', $result['subtotal'])
        + (int) str_replace('.', '', $result['vat']);

    expect($sumInCents)->toBe((int) str_replace('.', '', $result['total']));
})->with(['0.01', '0.14', '12.34', '70.25', '85.25', '999.99']);
