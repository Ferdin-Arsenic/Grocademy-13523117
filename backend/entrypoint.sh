#!/bin/sh

# Function to wait for database
wait_for_db() {
    echo "Waiting for database to be ready..."
    until pg_isready -h db -p 5432 -U user; do
        echo "Database is unavailable - sleeping"
        sleep 2
    done
    echo "Database is ready!"
}

echo "Starting entrypoint script..."
wait_for_db

echo "Generating Prisma client..."
npx prisma generate

echo "Running database migrations (development mode)..."
npx prisma migrate dev --name auto-migrate --create-only || echo "Migration creation failed, continuing..."
npx prisma migrate deploy || echo "Migration deploy failed, continuing..."

echo "Running database seeding..."
npx prisma db seed || echo "Seeding completed or failed, continuing..."

echo "Starting application with: $@"
exec "$@"