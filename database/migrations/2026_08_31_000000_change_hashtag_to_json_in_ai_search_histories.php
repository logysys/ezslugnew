// database/migrations/2026_08_31_000000_change_hashtag_to_json_in_ai_search_histories.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ai_search_histories', function (Blueprint $table) {
            // Change hashtag from string to JSON
            $table->json('hashtag')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('ai_search_histories', function (Blueprint $table) {
            $table->string('hashtag')->nullable()->change();
        });
    }
};