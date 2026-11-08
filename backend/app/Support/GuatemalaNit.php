<?php

namespace App\Support;

final class GuatemalaNit
{
    public static function isValid(string $nit): bool
    {
        $normalized = preg_replace('/[-\s]/', '', strtoupper($nit));

        if ($normalized === null || ! preg_match('/^\d{2,9}$/', $normalized)) {
            return false;
        }

        $checkDigit = (int) substr($normalized, -1);
        $digits = substr($normalized, 0, -1);
        $length = strlen($digits) + 1;
        $sum = 0;

        foreach (str_split($digits) as $index => $digit) {
            $sum += (int) $digit * ($length - $index);
        }

        return ((11 - ($sum % 11)) % 11) === $checkDigit;
    }
}
