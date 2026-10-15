<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Club;
use App\Models\ClubMembership;

class ClubsController extends Controller
{
    public function index()
    {
        $clubs = Club::orderBy('name')->get(['id','name','category','description','cover']);
        return response()->json(['data' => $clubs]);
    }

    public function show($id)
    {
        $club = Club::find($id);
        if (!$club) return response()->json(['error' => 'CLUB_NOT_FOUND'], 404);
        return response()->json(['data' => $club]);
    }

    public function join(Request $request, $id)
    {
        $userId = $request->input('user_id');
        if (!$userId) return response()->json(['error' => 'MISSING_USER_ID'], 400);
        $exists = ClubMembership::where('club_id', $id)->where('user_id', $userId)->first();
        if ($exists) return response()->json(['message' => 'ALREADY_MEMBER']);
        $membership = ClubMembership::create(['club_id'=>$id,'user_id'=>$userId,'status'=>'pending']);
        return response()->json(['data'=>$membership], 201);
    }
}
