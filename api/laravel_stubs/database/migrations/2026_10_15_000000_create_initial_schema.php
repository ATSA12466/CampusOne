<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateInitialSchema extends Migration
{
    public function up()
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('email')->unique();
            $table->string('password');
            $table->string('role')->default('student');
            $table->timestamps();
        });

        Schema::create('refresh_tokens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('token')->unique();
            $table->timestamp('expires_at');
            $table->timestamps();
        });

        Schema::create('invitations', function (Blueprint $table) {
            $table->id();
            $table->string('email');
            $table->foreignId('sender_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('token')->unique();
            $table->string('status')->default('pending');
            $table->timestamp('accepted_at')->nullable();
            $table->timestamps();
        });

        Schema::create('announcements', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('content');
            $table->string('category')->nullable();
            $table->date('published_at')->nullable();
            $table->timestamps();
        });

        Schema::create('clubs', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('name');
            $table->string('category')->nullable();
            $table->text('description')->nullable();
            $table->string('cover')->nullable();
            $table->json('objectives')->nullable();
            $table->timestamps();
        });

        Schema::create('club_memberships', function (Blueprint $table) {
            $table->id();
            $table->string('club_id');
            $table->foreign('club_id')->references('id')->on('clubs')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('status')->default('pending');
            $table->timestamps();
        });

        Schema::create('events', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('venue')->nullable();
            $table->date('date')->nullable();
            $table->string('category')->nullable();
            $table->integer('seats')->default(0);
            $table->integer('registered')->default(0);
            $table->timestamps();
        });

        Schema::create('event_registrations', function (Blueprint $table) {
            $table->id();
            $table->string('event_id');
            $table->foreign('event_id')->references('id')->on('events')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
        });

        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('owner_id')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('course')->nullable();
            $table->string('priority')->nullable();
            $table->timestamp('due_date')->nullable();
            $table->string('status')->default('todo');
            $table->timestamps();
        });

        Schema::create('timetable_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('owner_id')->constrained('users')->cascadeOnDelete();
            $table->string('day')->nullable();
            $table->string('course')->nullable();
            $table->string('start_time')->nullable();
            $table->string('end_time')->nullable();
            $table->string('venue')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('timetable_entries');
        Schema::dropIfExists('tasks');
        Schema::dropIfExists('event_registrations');
        Schema::dropIfExists('events');
        Schema::dropIfExists('club_memberships');
        Schema::dropIfExists('clubs');
        Schema::dropIfExists('announcements');
        Schema::dropIfExists('invitations');
        Schema::dropIfExists('refresh_tokens');
        Schema::dropIfExists('users');
    }
}
