<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Checking Users ===\n";

try {
    $users = \App\Models\User::all(['id', 'name', 'email']);
    
    if ($users->count() > 0) {
        echo "Found " . $users->count() . " users:\n";
        foreach ($users as $user) {
            echo "- ID: {$user->id}, Name: {$user->name}, Email: {$user->email}\n";
        }
    } else {
        echo "No users found in database.\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

echo "\n=== Done ===\n"; 