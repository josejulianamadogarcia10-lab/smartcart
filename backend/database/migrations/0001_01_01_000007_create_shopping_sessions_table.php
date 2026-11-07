<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shopping_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnUpdate()->restrictOnDelete();
            $table->foreignId('device_id')->constrained()->cascadeOnUpdate()->restrictOnDelete();
            $table->string('status')->default('active');
            $table->decimal('budget', 10, 2)->nullable();
            $table->timestamp('started_at');
            $table->timestamp('finished_at')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'device_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shopping_sessions');
    }
};
