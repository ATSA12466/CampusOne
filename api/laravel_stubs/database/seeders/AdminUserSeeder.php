<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use App\Models\User;

class AdminUserSeeder extends Seeder
{
    public function run()
    {
        $email = env('ADMIN_EMAIL', 'godword29@gmail.com');
        $password = env('ADMIN_PASSWORD', 'Godwordsolomon');

        // Check if admin exists
        $existing = DB::table('users')->where('email', $email)->first();
        if ($existing) {
            $this->command->info("Admin user already exists: {$email}");
            return;
        }

        // Create admin user using Eloquent if available or DB facade
        if (class_exists('\App\\Models\\User')) {
            \App\Models\User::create([
                'email' => $email,
                'password' => Hash::make($password),
                'role' => 'admin',
            ]);
        } else {
            DB::table('users')->insert([
                'email' => $email,
                'password' => password_hash($password, PASSWORD_DEFAULT),
                'role' => 'admin',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $this->command->info("Seeded admin user: {$email}");
    }
}
