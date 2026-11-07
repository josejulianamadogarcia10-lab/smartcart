<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCartItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['quantity' => ['required', 'integer', 'between:1,99']];
    }

    public function messages(): array
    {
        return ['quantity.between' => 'La cantidad debe estar entre 1 y 99 unidades.'];
    }
}
