<?php

namespace App\Policies;

use App\Models\AudioFile;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class AudioFilePolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return false;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, AudioFile $audioFile): bool
    {
        return $user->id === $audioFile->user_id;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return true; // Any authenticated user can create audio files
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, AudioFile $audioFile): bool
    {
        return $user->id === $audioFile->user_id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, AudioFile $audioFile): bool
    {
        return $user->id === $audioFile->user_id;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, AudioFile $audioFile): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, AudioFile $audioFile): bool
    {
        return false;
    }
}
