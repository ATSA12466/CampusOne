<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DemoDataSeeder extends Seeder
{
    public function run()
    {
        DB::table('clubs')->insertOrIgnore([
            ['id'=>'club-1','name'=>'Code Collective','category'=>'Technology','description'=>'Peer coding sessions, hackathons, and product showcases.','cover'=>'/images/placeholders/club-code.svg','objectives'=>json_encode(['Build practical projects','Mentor freshers','Host hackathons'])],
            ['id'=>'club-2','name'=>'Debate Assembly','category'=>'Public Speaking','description'=>'Weekly debate and communication workshops.','cover'=>'/images/placeholders/club-debate.svg','objectives'=>json_encode(['Critical thinking','Confident public speaking'])],
        ]);

        DB::table('events')->insertOrIgnore([
            ['id'=>'e1','title'=>'Innovation Night','venue'=>'Main Auditorium','date'=>'2026-10-16','category'=>'Showcase','seats'=>300,'registered'=>120],
            ['id'=>'e2','title'=>'Data Science Career Talk','venue'=>'Seminar Hall A','date'=>'2026-10-20','category'=>'Career','seats'=>180,'registered'=>86],
        ]);

        DB::table('announcements')->insertOrIgnore([
            ['title'=>'SRC study space extension approved','content'=>'Study commons now open till 10pm during exams.','category'=>'src','published_at'=>'2026-10-08'],
            ['title'=>'Club fair this Friday','content'=>'Discover 30+ clubs at the innovation square.','category'=>'campus','published_at'=>'2026-10-07'],
        ]);
    }
}
