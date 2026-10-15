# Laravel conversion instructions

This directory contains prepared stubs that will be copied into a Laravel app when you run the conversion script.

Steps to perform the conversion (run locally):

1. Ensure composer and PHP (>=8.1) are installed.
2. From repository root run:

   bash scripts/convert_to_laravel.sh

3. In ./api run:

   composer install
   cp .env.example .env
   php artisan key:generate
   php artisan jwt:secret
   php artisan migrate --seed
   php artisan serve --host=0.0.0.0 --port=8000

4. Point frontend to the API:

   export NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api

Notes:
- SMTP and SMS placeholders are present in api/.env.example. Fill them when you have credentials.
- The conversion script attempts to copy the stubs into the Laravel app; if files conflict you may need to move them manually.
