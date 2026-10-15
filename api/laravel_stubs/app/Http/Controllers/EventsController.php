<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Event;
use App\Models\EventRegistration;

class EventsController extends Controller
{
    public function index()
    {
        return response()->json(['data' => Event::orderBy('date','desc')->get()]);
    }

    public function show($id)
    {
        $event = Event::find($id);
        if (!$event) return response()->json(['error' => 'EVENT_NOT_FOUND'], 404);
        return response()->json(['data' => $event]);
    }

    public function register(Request $request, $id)
    {
        $userId = $request->input('user_id');
        if (!$userId) return response()->json(['error' => 'MISSING_USER_ID'], 400);
        $reg = EventRegistration::create(['event_id'=>$id,'user_id'=>$userId]);
        // increment
        $event = Event::find($id);
        if ($event) { $event->registered++; $event->save(); }
        return response()->json(['data'=>$reg], 201);
    }
}
