<?php

namespace App\Support;

final class Ean13
{
    public static function isValid(string $barcode): bool
    {
        if (! preg_match('/^\d{13}$/', $barcode)) {
            return false;
        }

        $digits = array_map('intval', str_split($barcode));
        $sum = 0;

        for ($index = 0; $index < 12; $index++) {
            $sum += $digits[$index] * ($index % 2 === 0 ? 1 : 3);
        }

        $checkDigit = (10 - ($sum % 10)) % 10;

        return $checkDigit === $digits[12];
    }
}
