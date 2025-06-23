<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProcessingPreset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class ProcessingPresetController extends Controller
{
    /**
     * Get all presets for the authenticated user
     */
    public function index(): JsonResponse
    {
        $presets = ProcessingPreset::where('user_id', Auth::id())
            ->orWhere('is_default', true)
        ->orderBy('is_default', 'desc')
        ->orderBy('name')
        ->get();

        return response()->json([
            'data' => $presets
        ]);
    }

    /**
     * Get a specific preset
     */
    public function show(ProcessingPreset $preset): JsonResponse
    {
        // Only allow viewing user's own presets or default presets
        if ($preset->user_id !== Auth::id() && !$preset->is_default) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        return response()->json([
            'data' => $preset
        ]);
    }

    /**
     * Create a new preset
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
            'settings' => 'required|array',
            'settings.ai_mastering' => 'nullable|array',
            'settings.ai_mastering.target_loudness' => 'nullable|numeric|between:-30,-6',
            'settings.ai_mastering.preset' => 'nullable|string',
            'settings.post_eq' => 'nullable|array',
            'settings.post_eq.enabled' => 'nullable|boolean',
            'settings.post_eq.bass' => 'nullable|numeric|between:-12,12',
            'settings.post_eq.low_mid' => 'nullable|numeric|between:-12,12',
            'settings.post_eq.mid' => 'nullable|numeric|between:-12,12',
            'settings.post_eq.high_mid' => 'nullable|numeric|between:-12,12',
            'settings.post_eq.treble' => 'nullable|numeric|between:-12,12',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Check if user already has a preset with this name
        $existingPreset = ProcessingPreset::where('user_id', Auth::id())
            ->where('name', $request->name)
            ->first();

        if ($existingPreset) {
            return response()->json([
                'error' => 'You already have a preset with this name'
            ], 409);
        }

        $preset = ProcessingPreset::create([
            'name' => $request->name,
            'description' => $request->description,
            'settings' => $request->settings,
            'is_default' => false,
            'user_id' => Auth::id(),
        ]);

        return response()->json([
            'message' => 'Preset created successfully',
            'data' => $preset
        ], 201);
    }

    /**
     * Update a preset
     */
    public function update(Request $request, ProcessingPreset $preset): JsonResponse
    {
        // Only allow updating user's own presets
        if ($preset->user_id !== Auth::id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string|max:500',
            'settings' => 'sometimes|required|array',
            'settings.ai_mastering' => 'nullable|array',
            'settings.ai_mastering.target_loudness' => 'nullable|numeric|between:-30,-6',
            'settings.ai_mastering.preset' => 'nullable|string',
            'settings.post_eq' => 'nullable|array',
            'settings.post_eq.enabled' => 'nullable|boolean',
            'settings.post_eq.bass' => 'nullable|numeric|between:-12,12',
            'settings.post_eq.low_mid' => 'nullable|numeric|between:-12,12',
            'settings.post_eq.mid' => 'nullable|numeric|between:-12,12',
            'settings.post_eq.high_mid' => 'nullable|numeric|between:-12,12',
            'settings.post_eq.treble' => 'nullable|numeric|between:-12,12',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Check for name conflicts (excluding current preset)
        if ($request->has('name')) {
            $existingPreset = ProcessingPreset::where('user_id', Auth::id())
                ->where('name', $request->name)
                ->where('id', '!=', $preset->id)
                ->first();

            if ($existingPreset) {
                return response()->json([
                    'error' => 'You already have a preset with this name'
                ], 409);
            }
        }

        $preset->update($request->only(['name', 'description', 'settings']));

        return response()->json([
            'message' => 'Preset updated successfully',
            'data' => $preset->fresh()
        ]);
    }

    /**
     * Delete a preset
     */
    public function destroy(ProcessingPreset $preset): JsonResponse
    {
        // Only allow deleting user's own presets
        if ($preset->user_id !== Auth::id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $preset->delete();

        return response()->json([
            'message' => 'Preset deleted successfully'
        ]);
    }

    /**
     * Get EQ bands configuration
     */
    public function getBands(): JsonResponse
    {
        $bands = [
            [
                'id' => 'bass',
                'name' => 'Bass',
                'frequency' => '60-250 Hz',
                'description' => 'Low frequency content, warmth and power',
                'range' => [-12, 12],
                'default' => 0
            ],
            [
                'id' => 'low_mid',
                'name' => 'Low Mid',
                'frequency' => '250-500 Hz',
                'description' => 'Lower midrange, body and fullness',
                'range' => [-12, 12],
                'default' => 0
            ],
            [
                'id' => 'mid',
                'name' => 'Mid',
                'frequency' => '500-2000 Hz',
                'description' => 'Midrange, presence and clarity',
                'range' => [-12, 12],
                'default' => 0
            ],
            [
                'id' => 'high_mid',
                'name' => 'High Mid',
                'frequency' => '2-4 kHz',
                'description' => 'Upper midrange, definition and attack',
                'range' => [-12, 12],
                'default' => 0
            ],
            [
                'id' => 'treble',
                'name' => 'Treble',
                'frequency' => '4-20 kHz',
                'description' => 'High frequency content, brightness and air',
                'range' => [-12, 12],
                'default' => 0
            ]
        ];
        
        return response()->json([
            'data' => $bands
        ]);
    }

    /**
     * Get EQ usage statistics
     */
    public function getStats(): JsonResponse
    {
        $userPresets = ProcessingPreset::where('user_id', Auth::id())->get();
        
        $stats = [
            'total_presets' => $userPresets->count(),
            'default_presets' => ProcessingPreset::where('is_default', true)->count(),
            'most_used_settings' => $this->getMostUsedSettings($userPresets),
            'recent_activity' => $this->getRecentActivity(),
        ];

        return response()->json([
            'data' => $stats
        ]);
    }

    /**
     * Get most used EQ settings
     */
    private function getMostUsedSettings($presets): array
    {
        $settings = [];
        
        foreach ($presets as $preset) {
            if (isset($preset->settings['post_eq'])) {
                $eq = $preset->settings['post_eq'];
                foreach ($eq as $band => $value) {
                    if (is_numeric($value)) {
                        if (!isset($settings[$band])) {
                            $settings[$band] = [];
                        }
                        $settings[$band][] = $value;
                    }
                }
            }
        }

        $averages = [];
        foreach ($settings as $band => $values) {
            $averages[$band] = round(array_sum($values) / count($values), 1);
        }

        return $averages;
    }

    /**
     * Get recent preset activity
     */
    private function getRecentActivity(): array
    {
        $recentPresets = ProcessingPreset::where('user_id', Auth::id())
            ->orderBy('updated_at', 'desc')
            ->limit(5)
            ->get(['id', 'name', 'updated_at']);

        return $recentPresets->map(function ($preset) {
            return [
                'id' => $preset->id,
                'name' => $preset->name,
                'updated_at' => $preset->updated_at->diffForHumans(),
            ];
        })->toArray();
    }
}
