<?php

use App\Support\GuatemalaNit;

it('valida NIT calculado con módulo 11', function (): void {
    expect(GuatemalaNit::isValid('123456-0'))->toBeTrue();
    expect(GuatemalaNit::isValid('000000-0'))->toBeTrue();
    expect(GuatemalaNit::isValid('123456-9'))->toBeFalse();
});

it('rechaza formatos inválidos de NIT', function (string $nit): void {
    expect(GuatemalaNit::isValid($nit))->toBeFalse();
})->with(['CF', '123456', '123456-99', 'ABCDEF-1']);
