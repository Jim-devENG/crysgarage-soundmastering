<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Throwable;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Illuminate\Http\JsonResponse;

class Handler extends ExceptionHandler
{
    protected $dontReport = [
        //
    ];

    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            if (app()->bound('sentry')) {
                app('sentry')->captureException($e);
            }
        });

        $this->renderable(function (Throwable $e, $request) {
            if ($request->expectsJson()) {
                return $this->handleApiException($e);
            }
        });
    }

    private function handleApiException(Throwable $e): JsonResponse
    {
        $statusCode = $this->getStatusCode($e);
        $response = [
            'message' => $this->getMessage($e),
            'status' => $statusCode,
        ];

        if (config('app.debug')) {
            $response['debug'] = [
                'message' => $e->getMessage(),
                'exception' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ];
        }

        return response()->json($response, $statusCode);
    }

    private function getStatusCode(Throwable $e): int
    {
        if ($e instanceof ValidationException) {
            return 422;
        }
        if ($e instanceof AuthenticationException) {
            return 401;
        }
        if ($e instanceof ModelNotFoundException) {
            return 404;
        }
        if ($e instanceof NotFoundHttpException) {
            return 404;
        }

        return $e->getCode() ?: 500;
    }

    private function getMessage(Throwable $e): string
    {
        if ($e instanceof ValidationException) {
            return 'The given data was invalid.';
        }
        if ($e instanceof AuthenticationException) {
            return 'Unauthenticated.';
        }
        if ($e instanceof ModelNotFoundException) {
            return 'Resource not found.';
        }
        if ($e instanceof NotFoundHttpException) {
            return 'Route not found.';
        }

        return $e->getMessage() ?: 'Server Error';
    }
} 