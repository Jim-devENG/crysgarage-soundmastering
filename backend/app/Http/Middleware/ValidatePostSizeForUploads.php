<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Http\Exceptions\PostTooLargeException;

class ValidatePostSizeForUploads
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Check if this is an audio upload request
        $isAudioUpload = $request->is('api/audio/upload') || 
                        $request->is('api/audio-files') || 
                        $request->hasFile('audio');

        if ($isAudioUpload) {
            // For audio uploads, use our custom limit (100MB)
            $maxSize = config('audio.file_size.max_upload_size', 100 * 1024 * 1024);
        } else {
            // For other requests, use the standard PHP post_max_size
            $maxSize = $this->getPostMaxSize();
        }

        $contentLength = $request->server('CONTENT_LENGTH');

        if ($contentLength && $contentLength > $maxSize) {
            throw new PostTooLargeException('The uploaded file exceeds the maximum allowed size.');
        }

        return $next($request);
    }

    /**
     * Get the POST max size from PHP configuration.
     */
    protected function getPostMaxSize(): int
    {
        $postMaxSize = ini_get('post_max_size');
        
        if (is_numeric($postMaxSize)) {
            return (int) $postMaxSize;
        }

        $metric = strtoupper(substr($postMaxSize, -1));
        $postMaxSize = (int) $postMaxSize;

        switch ($metric) {
            case 'K':
                return $postMaxSize * 1024;
            case 'M':
                return $postMaxSize * 1048576;
            case 'G':
                return $postMaxSize * 1073741824;
            default:
                return $postMaxSize;
        }
    }
} 