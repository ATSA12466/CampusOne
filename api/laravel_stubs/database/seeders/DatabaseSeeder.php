<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run()
    {
        // Demo data
        $this->call(DemoDataSeeder::class);

        // Admin user
        $this->call(AdminUserSeeder::class);
    }
}
