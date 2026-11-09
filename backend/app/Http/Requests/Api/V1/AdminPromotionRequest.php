<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class AdminPromotionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'promo_price' => ['required', 'numeric', 'min:0.01'],
            'label' => ['required', 'string', 'max:255'],
            'starts_at' => ['nullable', 'date', 'required_with:ends_at'],
            'ends_at' => ['nullable', 'date', 'after:starts_at', 'required_with:starts_at'],
            'active' => ['sometimes', 'boolean'],
        ];
    }
}
