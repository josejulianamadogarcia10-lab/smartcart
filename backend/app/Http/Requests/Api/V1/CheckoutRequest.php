<?php

namespace App\Http\Requests\Api\V1;

use App\Support\GuatemalaNit;
use Illuminate\Foundation\Http\FormRequest;

class CheckoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'invoice_type' => ['required', 'in:CF,NIT,cf,nit'],
            'nit' => ['nullable', 'required_if:invoice_type,NIT,nit', 'string', function (string $attribute, mixed $value, \Closure $fail): void {
                if ($value !== null && ! GuatemalaNit::isValid((string) $value)) {
                    $fail('El NIT no es válido.');
                }
            }],
            'payment_method' => ['required', 'in:card,fast_checkout'],
            'simulate_failure' => ['sometimes', 'boolean'],
            'force_check' => ['sometimes', 'boolean'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('invoice_type')) {
            $this->merge(['invoice_type' => strtoupper((string) $this->input('invoice_type'))]);
        }
    }
}
