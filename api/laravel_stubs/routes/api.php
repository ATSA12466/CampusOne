<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UsersController;
use App\Http\Controllers\AnnouncementsController;
use App\Http\Controllers\ClubsController;
use App\Http\Controllers\EventsController;

Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);
    Route::get('me', [AuthController::class, 'me'])->middleware('auth:api');
    Route::post('logout', [AuthController::class, 'logout'])->middleware('auth:api');
});

Route::get('health', function() { return response()->json(['status'=>'ok','time'=>now()]); });

Route::apiResource('announcements', AnnouncementsController::class)->only(['index','store']);
Route::get('clubs', [ClubsController::class, 'index']);
Route::get('clubs/{id}', [ClubsController::class, 'show']);
Route::post('clubs/{id}/join', [ClubsController::class, 'join']);
Route::get('events', [EventsController::class, 'index']);
Route::get('events/{id}', [EventsController::class, 'show']);
Route::post('events/{id}/register', [EventsController::class, 'register']);
