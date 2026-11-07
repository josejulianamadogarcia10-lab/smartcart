<?php

namespace App\Policies;

use App\Models\ShoppingSession;
use App\Models\User;

class ShoppingSessionPolicy
{
    public function view(User $user, ShoppingSession $session): bool
    {
        return $user->id === $session->user_id;
    }

    public function update(User $user, ShoppingSession $session): bool
    {
        return $this->view($user, $session) && $session->status === 'active';
    }
}
