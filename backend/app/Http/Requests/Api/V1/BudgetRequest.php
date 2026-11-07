<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class BudgetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'budget' => ['sometimes', 'nullable', 'numeric', 'gt:0', 'max:1000000', 'decimal:0,2'],
        ];
    }

    public function messages(): array
    {
        return [
            'budget.gt' => 'El presupuesto debe ser mayor que Q0.00.',
            'budget.max' => 'El presupuesto no puede superar Q1,000,000.00.',
            'budget.decimal' => 'El presupuesto debe tener hasta dos decimales.',
        ];
    }
}
