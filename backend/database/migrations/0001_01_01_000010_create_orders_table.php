<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shopping_session_id')->unique()->constrained()->cascadeOnUpdate()->restrictOnDelete();
            $table->string('invoice_type');
            $table->string('nit')->nullable();
            $table->decimal('subtotal', 10, 2);
            $table->decimal('vat', 10, 2);
            $table->decimal('total', 10, 2);
            $table->string('payment_method');
            $table->string('status')->default('paid');
            $table->boolean('requires_check')->default(false);
            $table->string('exit_code')->unique();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
