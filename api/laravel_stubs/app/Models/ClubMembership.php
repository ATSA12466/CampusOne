<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClubMembership extends Model
{
    use HasFactory;
    protected $fillable = ['club_id','user_id','status'];
}
