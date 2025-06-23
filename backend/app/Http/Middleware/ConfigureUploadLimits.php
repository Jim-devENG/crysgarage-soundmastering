<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ConfigureUploadLimits
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Only apply to upload routes
        if ($request->is('api/audio/upload') || $request->is('api/audio-files')) {
            // Set PHP configuration for large file uploads
            if (function_exists('ini_set')) {
                ini_set('upload_max_filesize', '100M');
                ini_set('post_max_size', '100M');
                ini_set('max_execution_time', '300');
                ini_set('max_input_time', '300');
                ini_set('memory_limit', '256M');
                ini_set('max_file_uploads', '20');
                ini_set('max_input_vars', '3000');
            }
        }

        return $next($request);
    }
} 