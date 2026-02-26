<?php

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
        Schema::table('shifts', function (Blueprint $table): void {
            $table->string('address')->default('')->after('details');
            $table->string('work_format')->default('offline')->after('longitude');
            $table->unsignedSmallInteger('required_workers')->default(1)->after('work_format');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('shifts', function (Blueprint $table): void {
            $table->dropColumn(['address', 'work_format', 'required_workers']);
        });
    }
};
