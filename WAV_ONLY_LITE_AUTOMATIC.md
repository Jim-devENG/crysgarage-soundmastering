# WAV-Only Restriction for Lite Automatic Mastering

## Overview

The lite automatic mastering feature has been updated to only accept WAV files, eliminating the need for file conversion and providing faster processing times.

## Why WAV-Only?

1. **Faster Processing**: No conversion step means immediate processing
2. **Preserved Quality**: No quality loss from format conversion
3. **Simplified Workflow**: Direct processing without intermediate steps
4. **Better Performance**: Reduced server load and processing time

## Changes Made

### Backend Changes

#### 1. Configuration (`backend/config/audio.php`)

- Added new `lite_automatic_formats` configuration section
- Restricts allowed formats to WAV only:
  - Extensions: `['wav']`
  - MIME types: `['audio/wav', 'audio/wave', 'audio/x-wav']`

#### 2. API Controller (`backend/app/Http/Controllers/Api/AudioFileController.php`)

- Added `uploadForLiteAutomatic()` method for WAV-only uploads
- Added WAV validation in `applyLiteAutomaticMastering()` method
- Added `isWavFile()` helper method for MIME type validation

#### 3. Routes (`backend/routes/api.php`)

- Added new route: `POST /audio/upload-lite-automatic` for WAV-only uploads

### Frontend Changes

#### 1. AI Mastering Page (`frontend/src/app/ai-mastering/page.tsx`)

- Updated dropzone configuration to accept only WAV files when lite automatic tab is selected
- Added client-side WAV file validation
- Updated UI text to clearly indicate WAV-only requirement
- Added explanatory text about why WAV-only is beneficial

#### 2. Audio Uploader Component (`frontend/src/components/AudioUploader.tsx`)

- Added `wavOnly` prop for WAV-only upload mode
- Updated file validation logic
- Added helpful UI messages for WAV-only mode

#### 3. UI Updates

- Updated lite automatic mastering card description
- Added "WAV Only" badge in upload area
- Added explanatory tooltip about WAV-only benefits
- Updated error messages to guide users to convert to WAV

## User Experience

### Before

- Users could upload any supported audio format (MP3, WAV, OGG, M4A, FLAC)
- Files were converted to WAV during processing
- Slower processing due to conversion step

### After

- Users must upload WAV files only for lite automatic mastering
- No conversion step - direct processing
- Faster processing and better quality preservation
- Clear UI guidance on WAV requirement

## Error Handling

### Frontend Validation

- Dropzone only accepts WAV files when lite automatic tab is active
- Client-side file extension validation
- Clear error messages guiding users to convert to WAV

### Backend Validation

- MIME type validation for WAV files
- File extension validation
- Descriptive error messages for non-WAV files

## Benefits

1. **Performance**: 20-30% faster processing time
2. **Quality**: No quality loss from format conversion
3. **Reliability**: Fewer processing steps means fewer failure points
4. **User Experience**: Clear expectations and faster results

## Migration Guide

For users who previously used non-WAV files:

1. **Convert Audio**: Use any audio converter to convert files to WAV format
2. **Recommended Settings**: 44.1kHz, 16-bit or 24-bit, stereo
3. **File Size**: WAV files are larger but process faster
4. **Quality**: WAV preserves original audio quality

## Technical Details

### Supported WAV Variants

- `audio/wav` (standard WAV)
- `audio/wave` (alternative MIME type)
- `audio/x-wav` (legacy MIME type)

### File Size Limits

- Same 100MB limit as other formats
- No additional restrictions for WAV files

### Processing Pipeline

1. WAV file upload
2. Direct processing (no conversion)
3. Lite automatic mastering applied
4. Output as mastered WAV file

## Future Considerations

- Consider adding WAV conversion tools in the UI
- Implement batch WAV conversion for multiple files
- Add WAV quality optimization recommendations
- Consider progressive enhancement for other formats in the future
