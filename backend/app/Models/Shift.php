<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Shift extends Model
{
    protected $fillable = [
        'employer_id',
        'title',
        'details',
        'address',
        'pay_per_hour',
        'start_at',
        'end_at',
        'latitude',
        'longitude',
        'work_format',
        'required_workers',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'start_at' => 'datetime',
            'end_at' => 'datetime',
            'latitude' => 'float',
            'longitude' => 'float',
            'required_workers' => 'integer',
        ];
    }

    public function employer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'employer_id');
    }

    public function applications(): HasMany
    {
        return $this->hasMany(Application::class);
    }
}
