#!/bin/sh
set -e

echo "Waiting for database and running migrations..."
alembic upgrade head
echo "Migrations complete."

exec "$@"
