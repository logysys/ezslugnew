<?php
// database/migrations/xxxx_xx_xx_create_saved_pages_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('saved_pages', function (Blueprint $table) {
            $table->id();
            $table->string('title')->nullable();
            $table->string('slug', 64)->unique(); // public share id
            $table->string('layout_mode', 20); // row | carousel | masonry
            $table->longText('html'); // generated HTML
            $table->json('slots')->nullable(); // raw slots for re-editing
            $table->json('settings')->nullable(); // gap, masonry config, etc.
            $table->string('edit_token', 64)->nullable()->index(); // secret for editing
            $table->ipAddress('creator_ip')->nullable();
            $table->unsignedBigInteger('views')->default(0);
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('saved_pages');
    }
};