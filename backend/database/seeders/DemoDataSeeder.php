<?php

namespace Database\Seeders;

use App\Models\Application;
use App\Models\Review;
use App\Models\Shift;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class DemoDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $employer = User::create([
            'name' => 'Cafe Central',
            'phone' => '380671112233',
            'email' => 'cafe@quickgig.app',
            'password' => '123456',
            'role' => 'employer',
        ]);

        $worker = User::create([
            'name' => 'Alex Ivanov',
            'phone' => '380673334455',
            'email' => 'alex@quickgig.app',
            'password' => '123456',
            'role' => 'worker',
        ]);

        $shiftA = Shift::create([
            'employer_id' => $employer->id,
            'title' => 'Бариста на утро',
            'details' => 'Смена в кофейне, нужен опыт с кассой',
            'address' => 'м. Київ, вул. Велика Васильківська, 55',
            'pay_per_hour' => 120,
            'start_at' => Carbon::now()->addDay()->setTime(8, 0),
            'end_at' => Carbon::now()->addDay()->setTime(16, 0),
            'latitude' => 50.4308,
            'longitude' => 30.5164,
            'work_format' => 'offline',
            'required_workers' => 2,
        ]);

        Shift::create([
            'employer_id' => $employer->id,
            'title' => 'Промо у ТЦ',
            'details' => 'Раздача листовок и консультации',
            'address' => 'м. Київ, ТРЦ Ocean Plaza',
            'pay_per_hour' => 110,
            'start_at' => Carbon::now()->addDays(2)->setTime(11, 0),
            'end_at' => Carbon::now()->addDays(2)->setTime(18, 0),
            'latitude' => 50.4128,
            'longitude' => 30.5226,
            'work_format' => 'offline',
            'required_workers' => 3,
        ]);

        Shift::create([
            'employer_id' => $employer->id,
            'title' => 'Оператор чату',
            'details' => 'Відповіді клієнтам у чаті підтримки, готові скрипти.',
            'address' => 'Онлайн',
            'pay_per_hour' => 175,
            'start_at' => Carbon::now()->addDays(1)->setTime(10, 0),
            'end_at' => Carbon::now()->addDays(1)->setTime(17, 0),
            'latitude' => 50.4501,
            'longitude' => 30.5234,
            'work_format' => 'online',
            'required_workers' => 2,
        ]);

        Application::create([
            'shift_id' => $shiftA->id,
            'worker_id' => $worker->id,
            'status' => 'pending',
        ]);

        Review::create([
            'from_user_id' => $worker->id,
            'to_user_id' => $employer->id,
            'rating' => 5,
            'comment' => 'Выплата вовремя, четкая постановка задачи',
        ]);
    }
}
