#!/usr/bin/env bash
# scripts/convert_to_laravel.sh
# Run this locally from the repository root to create a Laravel project under ./api,
# then copy prepared stub controllers, migrations and seeders into the new Laravel app.

set -euo pipefail

echo "This script will scaffold a Laravel project under ./api and apply prepared stubs."
read -p "Proceed? (y/N) " confirm
if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
  echo "Aborting."
  exit 1
fi

if ! command -v composer >/dev/null 2>&1; then
  echo "composer is required. Install composer and try again." >&2
  exit 2
fi

# Create Laravel project in ./api
if [ -d "api/vendor" ] || [ -f "api/artisan" ]; then
  echo "Laravel app already exists in ./api. Skipping create-project step." 
else
  composer create-project laravel/laravel api
fi

cd api

# Install JWT package (tymon/jwt-auth) for JWT support
composer require tymon/jwt-auth:^1.0 --no-interaction || true

# Copy stubs from ../api/laravel_stubs into the new Laravel project
cd ..

STUB_DIR="api/laravel_stubs"
if [ -d "$STUB_DIR" ]; then
  echo "Copying stubs into Laravel app..."
  cp -R ${STUB_DIR}/app/* api/app/
  cp -R ${STUB_DIR}/database/* api/database/
  cp -R ${STUB_DIR}/routes/* api/routes/
  cp -R ${STUB_DIR}/config/* api/config/ || true
else
  echo "No stubs found at $STUB_DIR. Nothing to copy."
fi

# Final instructions
cat <<EOF
Laravel scaffold complete (or already present). Next steps:

1. Edit ./api/.env to set DB_*, JWT_SECRET and mail/SMS provider placeholders.
2. From repo root run:

   cd api
   composer install
   php artisan key:generate
   php artisan jwt:secret
   php artisan migrate --seed
   php artisan serve --host=0.0.0.0 --port=8000

3. Set frontend env:

   export NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api

4. The prepared API controllers and routes are copied into the Laravel app. Test endpoints like:

   GET http://localhost:8000/api/health
   GET http://localhost:8000/api/clubs
   POST http://localhost:8000/api/auth/register

EOF
