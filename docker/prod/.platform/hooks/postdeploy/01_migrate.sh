#!/bin/bash
set -e

LEADER=$(cat /opt/elasticbeanstalk/deploy/leader 2>/dev/null || echo "false")
if [ "$LEADER" = "true" ]; then
    echo "Compiling translations..."
    docker compose exec -T iaso python manage.py compilemessages
    
    echo "Collecting static files..."
    docker compose exec -T iaso python manage.py collectstatic --noinput

    echo "Running migrations..."
    docker compose exec -T iaso python manage.py migrate --noinput

    echo "Creating cache table..."
    docker compose exec -T iaso python manage.py createcachetable
fi
