<?php

namespace Database\Seeders;

use App\Models\ProcessingPreset;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class EQPresetsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $presets = [
            [
                'name' => 'Flat EQ',
                'description' => 'No EQ adjustments - pure AI mastering',
                'settings' => [
                    'ai_mastering' => [
                        'target_loudness' => -14,
                        'preset' => 'default'
                    ],
                    'post_eq' => [
                        'enabled' => false,
                        'bass' => 0.0,
                        'low_mid' => 0.0,
                        'mid' => 0.0,
                        'high_mid' => 0.0,
                        'treble' => 0.0
                    ]
                ],
                'is_default' => true,
                'user_id' => null
            ],
            [
                'name' => 'Warm & Rich',
                'description' => 'Slight bass boost with gentle treble reduction for warmth',
                'settings' => [
                    'ai_mastering' => [
                        'target_loudness' => -14,
                        'preset' => 'default'
                    ],
                    'post_eq' => [
                        'enabled' => true,
                        'bass' => 2.0,
                        'low_mid' => 0.5,
                        'mid' => 0.0,
                        'high_mid' => -0.5,
                        'treble' => -1.0
                    ]
                ],
                'is_default' => false,
                'user_id' => null
            ],
            [
                'name' => 'Bright & Clear',
                'description' => 'Enhanced treble and presence for clarity',
                'settings' => [
                    'ai_mastering' => [
                        'target_loudness' => -14,
                        'preset' => 'default'
                    ],
                    'post_eq' => [
                        'enabled' => true,
                        'bass' => -0.5,
                        'low_mid' => 0.0,
                        'mid' => 1.0,
                        'high_mid' => 1.5,
                        'treble' => 2.0
                    ]
                ],
                'is_default' => false,
                'user_id' => null
            ],
            [
                'name' => 'Vocal Enhance',
                'description' => 'Optimized for vocal clarity and presence',
                'settings' => [
                    'ai_mastering' => [
                        'target_loudness' => -14,
                        'preset' => 'default'
                    ],
                    'post_eq' => [
                        'enabled' => true,
                        'bass' => -1.0,
                        'low_mid' => -0.5,
                        'mid' => 2.0,
                        'high_mid' => 1.5,
                        'treble' => 0.5
                    ]
                ],
                'is_default' => false,
                'user_id' => null
            ],
            [
                'name' => 'Bass Heavy',
                'description' => 'Significant bass enhancement for electronic music',
                'settings' => [
                    'ai_mastering' => [
                        'target_loudness' => -14,
                        'preset' => 'default'
                    ],
                    'post_eq' => [
                        'enabled' => true,
                        'bass' => 4.0,
                        'low_mid' => 1.5,
                        'mid' => -0.5,
                        'high_mid' => 0.0,
                        'treble' => 0.5
                    ]
                ],
                'is_default' => false,
                'user_id' => null
            ],
            [
                'name' => 'Radio Ready',
                'description' => 'Optimized for radio broadcast with controlled dynamics',
                'settings' => [
                    'ai_mastering' => [
                        'target_loudness' => -16,
                        'preset' => 'default'
                    ],
                    'post_eq' => [
                        'enabled' => true,
                        'bass' => -1.0,
                        'low_mid' => 0.0,
                        'mid' => 1.0,
                        'high_mid' => 2.0,
                        'treble' => 1.0
                    ]
                ],
                'is_default' => false,
                'user_id' => null
            ],
            [
                'name' => 'Streaming Optimized',
                'description' => 'Balanced for streaming platforms like Spotify',
                'settings' => [
                    'ai_mastering' => [
                        'target_loudness' => -14,
                        'preset' => 'default'
                    ],
                    'post_eq' => [
                        'enabled' => true,
                        'bass' => 1.0,
                        'low_mid' => 0.0,
                        'mid' => 0.5,
                        'high_mid' => -0.5,
                        'treble' => 0.0
                    ]
                ],
                'is_default' => false,
                'user_id' => null
            ]
        ];

        foreach ($presets as $presetData) {
            ProcessingPreset::updateOrCreate(
                ['name' => $presetData['name']],
                $presetData
            );
        }

        $this->command->info('Created ' . count($presets) . ' EQ presets');
    }
}
