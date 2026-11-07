<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('scan_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shopping_session_id')->constrained()->cascadeOnUpdate()->cascadeOnDelete();
            $table->char('barcode', 13);
            $table->string('result');
            $table->string('source');
            $table->timestamp('created_at')->useCurrent();
            $table->index(['shopping_session_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('scan_events');
    }
};
