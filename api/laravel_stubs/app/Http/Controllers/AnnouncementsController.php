<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Announcement;
use Illuminate\Support\Facades\Validator;

class AnnouncementsController extends Controller
{
    public function index()
    {
        $items = Announcement::orderBy('published_at', 'desc')->limit(100)->get();
        return response()->json(['data' => $items]);
    }

    public function store(Request $request)
    {
        $v = Validator::make($request->all(), ['title' => 'required', 'content' => 'required']);
        if ($v->fails()) return response()->json(['error' => 'INVALID_INPUT', 'details' => $v->errors()], 400);
        $ann = Announcement::create($request->only(['title','content','category','published_at']));
        return response()->json(['data' => $ann], 201);
    }
}
