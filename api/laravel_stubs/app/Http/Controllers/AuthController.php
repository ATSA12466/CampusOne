<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $v = Validator::make($request->all(), [
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6',
        ]);
        if ($v->fails()) return response()->json(['error' => 'INVALID_INPUT', 'details' => $v->errors()], 400);

        $user = User::create([
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'student',
        ]);

        return response()->json(['data' => $user], 201);
    }

    public function login(Request $request)
    {
        $credentials = $request->only(['email', 'password']);
        if (!$token = auth()->attempt($credentials)) {
            return response()->json(['error' => 'INVALID_CREDENTIALS'], 401);
        }
        return response()->json(['accessToken' => $token, 'user' => auth()->user()]);
    }

    public function me()
    {
        return response()->json(['data' => auth()->user()]);
    }

    public function logout()
    {
        auth()->logout();
        return response()->json(['message' => 'logged_out']);
    }
}
