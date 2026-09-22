<?php
// database/migrations/2026_08_30_000000_add_hashtag_to_ai_search_histories_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('ai_search_histories', function (Blueprint $table) {
            $table->string('hashtag')->nullable()->after('slug');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ai_search_histories', function (Blueprint $table) {
            $table->dropColumn('hashtag');
        });
    }
};