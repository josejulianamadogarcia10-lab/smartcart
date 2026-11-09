<?php

namespace App\Http\Requests\Api\V1;

use App\Support\Ean13;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AdminProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $product = $this->route('product');

        return [
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'barcode' => ['required', 'string', 'size:13', function (string $attribute, mixed $value, \Closure $fail): void {
                if (! Ean13::isValid((string) $value)) {
                    $fail('El código de barras EAN-13 no es válido.');
                }
            }, Rule::unique('products', 'barcode')->ignore($product?->id)],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'numeric', 'min:0.01'],
            'image_emoji' => ['required', 'string', 'max:10'],
            'image_url' => ['nullable', 'url', 'max:255'],
            'active' => ['sometimes', 'boolean'],
            'stock' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
