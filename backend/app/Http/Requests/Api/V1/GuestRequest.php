<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class GuestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'device_code' => ['required', 'string', Rule::exists('devices', 'code')->where('active', true)],
        ];
    }

    public function messages(): array
    {
        return ['device_code.exists' => 'El carrito no existe o está inactivo.'];
    }
}
