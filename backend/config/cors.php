<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [
    'http://crysgarage.studio:3000', 
    'http://crysgarage.studio:3001',
    'http://crysgarage.studio', 
    'http://crysgarage.studio'],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => ['Content-Disposition', 'Content-Length', 'Content-Type'],
    'max_age' => 0,
    'supports_credentials' => true,
]; 