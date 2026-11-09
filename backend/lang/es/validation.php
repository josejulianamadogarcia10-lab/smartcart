<?php

return [
    'accepted' => 'El campo :attribute debe aceptarse.',
    'after' => 'El campo :attribute debe ser una fecha posterior a :date.',
    'boolean' => 'El campo :attribute debe ser verdadero o falso.',
    'date' => 'El campo :attribute no es una fecha válida.',
    'email' => 'El campo :attribute debe ser un correo válido.',
    'exists' => 'El :attribute seleccionado no existe.',
    'integer' => 'El campo :attribute debe ser un número entero.',
    'max' => [
        'numeric' => 'El campo :attribute no puede ser mayor que :max.',
        'string' => 'El campo :attribute no puede tener más de :max caracteres.',
    ],
    'min' => [
        'numeric' => 'El campo :attribute debe ser al menos :min.',
        'string' => 'El campo :attribute debe tener al menos :min caracteres.',
    ],
    'numeric' => 'El campo :attribute debe ser un número.',
    'required' => 'El campo :attribute es obligatorio.',
    'required_with' => 'El campo :attribute es obligatorio cuando se proporciona :values.',
    'size' => ['string' => 'El :attribute debe tener :size dígitos.'],
    'string' => 'El campo :attribute debe ser texto.',
    'unique' => 'El :attribute ya está registrado.',
    'url' => 'El campo :attribute debe ser una URL válida.',
    'attributes' => [
        'barcode' => 'EAN-13', 'category_id' => 'categoría', 'image_emoji' => 'emoji',
        'image_url' => 'URL de imagen', 'name' => 'nombre', 'price' => 'precio',
        'promo_price' => 'precio de oferta', 'product_id' => 'producto', 'stock' => 'stock',
    ],
];
