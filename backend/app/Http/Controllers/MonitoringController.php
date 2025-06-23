<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class MonitoringController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $metrics = $request->all();

        if (!is_array($metrics)) {
            return response()->json(['error' => 'Invalid metrics data'], 400);
        }

        try {
            // Store metrics in cache for quick access
            $this->storeMetricsInCache($metrics);

            // Log metrics for analysis
            Log::channel('monitoring')->info('Application metrics', [
                'metrics' => $metrics,
            ]);

            // Store metrics in database if needed
            $this->storeMetricsInDatabase($metrics);

            return response()->json(['message' => 'Metrics stored successfully']);
        } catch (\Exception $e) {
            Log::error('Failed to store metrics', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json(['error' => 'Failed to store metrics'], 500);
        }
    }

    private function storeMetricsInCache(array $metrics): void
    {
        foreach ($metrics as $metric) {
            $key = "metric:{$metric['name']}:" . date('Y-m-d-H');
            Cache::put($key, $metric, now()->addHours(24));
        }
    }

    private function storeMetricsInDatabase(array $metrics): void
    {
        // Store metrics in database for long-term analysis
        foreach ($metrics as $metric) {
            DB::table('metrics')->insert([
                'name' => $metric['name'],
                'value' => $metric['value'],
                'timestamp' => date('Y-m-d H:i:s', $metric['timestamp'] / 1000),
                'tags' => json_encode($metric['tags'] ?? []),
                'created_at' => now(),
            ]);
        }
    }

    public function getMetrics(Request $request): JsonResponse
    {
        $name = $request->query('name');
        $startTime = $request->query('start_time');
        $endTime = $request->query('end_time');

        $query = DB::table('metrics');

        if ($name) {
            $query->where('name', $name);
        }

        if ($startTime) {
            $query->where('timestamp', '>=', date('Y-m-d H:i:s', $startTime / 1000));
        }

        if ($endTime) {
            $query->where('timestamp', '<=', date('Y-m-d H:i:s', $endTime / 1000));
        }

        $metrics = $query->get();

        return response()->json($metrics);
    }
} 