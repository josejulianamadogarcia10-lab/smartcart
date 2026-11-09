<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Device;
use App\Models\Product;
use App\Models\Promotion;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use InvalidArgumentException;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $adminPassword = env('E2E_ADMIN_PASSWORD', env('SEED_ADMIN_PASSWORD'));

        if (! is_string($adminPassword) || trim($adminPassword) === '') {
            throw new InvalidArgumentException(
                'No se puede ejecutar el seeder: define E2E_ADMIN_PASSWORD (E2E) o SEED_ADMIN_PASSWORD (local) en el entorno.',
            );
        }

        $categories = collect([
            ['name' => 'Lácteos', 'color_hex' => '#38bdf8', 'emoji' => '🥛'],
            ['name' => 'Panadería', 'color_hex' => '#f59e0b', 'emoji' => '🍞'],
            ['name' => 'Bebidas', 'color_hex' => '#3b82f6', 'emoji' => '🥤'],
            ['name' => 'Despensa', 'color_hex' => '#14b8a6', 'emoji' => '🛒'],
            ['name' => 'Frescos', 'color_hex' => '#22c55e', 'emoji' => '🥚'],
            ['name' => 'Hogar', 'color_hex' => '#8b5cf6', 'emoji' => '🏠'],
            ['name' => 'Cuidado personal', 'color_hex' => '#ec4899', 'emoji' => '🧴'],
        ])->mapWithKeys(fn (array $category) => [
            $category['name'] => Category::updateOrCreate(['name' => $category['name']], $category),
        ]);

        Device::updateOrCreate(['code' => 'CART-07'], ['name' => 'Carrito 07', 'active' => true]);

        $products = [
            ['barcode' => '7401000000015', 'name' => 'Leche entera 1 litro', 'category' => 'Lácteos', 'price' => 11.75, 'emoji' => '🥛'],
            ['barcode' => '7401000000022', 'name' => 'Queso fresco 400 g', 'category' => 'Lácteos', 'price' => 28.00, 'emoji' => '🧀'],
            ['barcode' => '7401000000039', 'name' => 'Mantequilla 250 g', 'category' => 'Lácteos', 'price' => 15.50, 'emoji' => '🧈'],
            ['barcode' => '7401000000046', 'name' => 'Pan de caja', 'category' => 'Panadería', 'price' => 18.50, 'emoji' => '🍞'],
            ['barcode' => '7401000000053', 'name' => 'Tortillas de maíz 1 libra', 'category' => 'Panadería', 'price' => 6.00, 'emoji' => '🫓'],
            ['barcode' => '7401000000060', 'name' => 'Gaseosa 2 litros', 'category' => 'Bebidas', 'price' => 14.00, 'emoji' => '🥤'],
            ['barcode' => '7401000000077', 'name' => 'Jugo de naranja 1 litro', 'category' => 'Bebidas', 'price' => 15.00, 'emoji' => '🧃'],
            ['barcode' => '7401000000084', 'name' => 'Agua pura 600 ml', 'category' => 'Bebidas', 'price' => 5.00, 'emoji' => '💧'],
            ['barcode' => '7401000000091', 'name' => 'Café molido 400 g', 'category' => 'Despensa', 'price' => 38.00, 'emoji' => '☕'],
            ['barcode' => '7401000000107', 'name' => 'Huevos docena', 'category' => 'Frescos', 'price' => 26.00, 'emoji' => '🥚'],
            ['barcode' => '7401000000114', 'name' => 'Frijol negro volteado en lata', 'category' => 'Despensa', 'price' => 15.00, 'emoji' => '🥫'],
            ['barcode' => '7401000000121', 'name' => 'Arroz 2 libras', 'category' => 'Despensa', 'price' => 14.50, 'emoji' => '🍚'],
            ['barcode' => '7401000000138', 'name' => 'Azúcar 2 libras', 'category' => 'Despensa', 'price' => 12.00, 'emoji' => '🍬'],
            ['barcode' => '7401000000145', 'name' => 'Aceite vegetal 1 litro', 'category' => 'Despensa', 'price' => 29.00, 'emoji' => '🫗'],
            ['barcode' => '7401000000152', 'name' => 'Espagueti 400 g', 'category' => 'Despensa', 'price' => 8.50, 'emoji' => '🍝'],
            ['barcode' => '7401000000169', 'name' => 'Cereal de avena 500 g', 'category' => 'Despensa', 'price' => 20.00, 'emoji' => '🥣'],
            ['barcode' => '7401000000176', 'name' => 'Galletas de soda', 'category' => 'Despensa', 'price' => 9.00, 'emoji' => '🍪'],
            ['barcode' => '7401000000183', 'name' => 'Papel higiénico 4 rollos', 'category' => 'Hogar', 'price' => 22.00, 'emoji' => '🧻'],
            ['barcode' => '7401000000190', 'name' => 'Detergente en polvo 1 kg', 'category' => 'Hogar', 'price' => 25.00, 'emoji' => '🧼'],
            ['barcode' => '7401000000206', 'name' => 'Champú 400 ml', 'category' => 'Cuidado personal', 'price' => 34.00, 'emoji' => '🧴'],
        ];

        foreach ($products as $data) {
            Product::updateOrCreate(
                ['barcode' => $data['barcode']],
                [
                    'category_id' => $categories[$data['category']]->id,
                    'name' => $data['name'],
                    'price' => $data['price'],
                    'image_emoji' => $data['emoji'],
                    'active' => true,
                ],
            );
        }

        foreach ([
            ['barcode' => '7401000000169', 'promo_price' => 16.00, 'label' => 'Antes Q20.00'],
            ['barcode' => '7401000000039', 'promo_price' => 13.50, 'label' => 'Antes Q15.50'],
            ['barcode' => '7401000000077', 'promo_price' => 15.00, 'label' => '2x1 en la segunda unidad'],
        ] as $data) {
            $product = Product::where('barcode', $data['barcode'])->firstOrFail();

            Promotion::updateOrCreate(
                ['product_id' => $product->id, 'label' => $data['label']],
                ['promo_price' => $data['promo_price'], 'active' => true],
            );
        }

        User::updateOrCreate(
            ['email' => 'admin@smartcart.test'],
            [
                'name' => 'Administrador SmartCart',
                'password' => Hash::make($adminPassword),
                'role' => 'admin',
                'email_verified_at' => now(),
            ],
        );

        User::updateOrCreate(
            ['qr_code' => 'SC-DEMO-0001'],
            ['name' => 'Cliente demo', 'email' => null, 'password' => null, 'role' => 'customer'],
        );
    }
}
