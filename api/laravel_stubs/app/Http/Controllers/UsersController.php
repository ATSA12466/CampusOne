<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;

class UsersController extends Controller
{
    public function show($id)
    {
        $user = User::find($id);
        if (!$user) return response()->json(['error' => 'USER_NOT_FOUND'], 404);
        return response()->json(['data' => $user]);
    }
}
