<?php

use App\Support\Ean13;

it('validates the twenty EAN-13 codes from the demo seeder', function (): void {
    $barcodes = [
        '7401000000015', '7401000000022', '7401000000039', '7401000000046',
        '7401000000053', '7401000000060', '7401000000077', '7401000000084',
        '7401000000091', '7401000000107', '7401000000114', '7401000000121',
        '7401000000138', '7401000000145', '7401000000152', '7401000000169',
        '7401000000176', '7401000000183', '7401000000190', '7401000000206',
    ];

    foreach ($barcodes as $barcode) {
        expect(Ean13::isValid($barcode))->toBeTrue();
    }
});

it('rejects malformed and invalid EAN-13 codes', function (string $barcode): void {
    expect(Ean13::isValid($barcode))->toBeFalse();
})->with([
    '740100000001',
    '74010000000155',
    '74010000000A5',
    '7401000000016',
]);
