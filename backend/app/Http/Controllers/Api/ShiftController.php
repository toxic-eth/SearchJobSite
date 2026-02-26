<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Shift;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShiftController extends Controller
{
    public function index(): JsonResponse
    {
        $shifts = Shift::with([
                'employer' => fn ($query) => $query
                    ->select('id', 'name')
                    ->withAvg('reviewsAboutMe as rating', 'rating')
                    ->withCount('reviewsAboutMe'),
            ])
            ->withCount('applications')
            ->where('status', 'open')
            ->orderBy('start_at')
            ->get();

        $payload = $shifts->map(function (Shift $shift) {
            return [
                'id' => $shift->id,
                'employer_id' => $shift->employer_id,
                'title' => $shift->title,
                'details' => $shift->details,
                'address' => $shift->address,
                'pay_per_hour' => $shift->pay_per_hour,
                'start_at' => $shift->start_at?->toISOString(),
                'end_at' => $shift->end_at?->toISOString(),
                'latitude' => $shift->latitude,
                'longitude' => $shift->longitude,
                'work_format' => $shift->work_format,
                'required_workers' => $shift->required_workers,
                'applications_count' => $shift->applications_count,
                'status' => $shift->status,
                'employer' => [
                    'id' => $shift->employer?->id,
                    'name' => $shift->employer?->name,
                    'rating' => $shift->employer?->rating ? round((float) $shift->employer->rating, 1) : 0,
                    'reviews_count' => (int) ($shift->employer?->reviews_about_me_count ?? 0),
                ],
            ];
        });

        return response()->json(['data' => $payload]);
    }

    public function show(Request $request, Shift $shift): JsonResponse
    {
        $shift->load('employer:id,name', 'applications.worker:id,name');

        $myApplication = null;
        if ($request->user()) {
            $myApplication = $shift->applications()
                ->where('worker_id', $request->user()->id)
                ->first();
        }

        return response()->json([
            'data' => $shift,
            'my_application' => $myApplication,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->role !== 'employer') {
            return response()->json(['message' => 'Только работодатель может создавать смены'], 403);
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:120'],
            'details' => ['nullable', 'string', 'max:1000'],
            'address' => ['nullable', 'string', 'max:255'],
            'pay_per_hour' => ['required', 'integer', 'min:1'],
            'start_at' => ['required', 'date'],
            'end_at' => ['required', 'date', 'after:start_at'],
            'latitude' => ['required', 'numeric'],
            'longitude' => ['required', 'numeric'],
            'work_format' => ['nullable', 'in:online,offline'],
            'required_workers' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $shift = Shift::create([
            ...$validated,
            'address' => $validated['address'] ?? '',
            'work_format' => $validated['work_format'] ?? 'offline',
            'required_workers' => $validated['required_workers'] ?? 1,
            'employer_id' => $user->id,
            'status' => 'open',
        ]);

        return response()->json(['data' => $shift], 201);
    }

    public function myShifts(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->role !== 'employer') {
            return response()->json(['message' => 'Только для работодателя'], 403);
        }

        $shifts = Shift::withCount('applications')
            ->where('employer_id', $user->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['data' => $shifts]);
    }
}
