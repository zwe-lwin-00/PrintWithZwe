#!/usr/bin/env bash
set -euo pipefail
cd /opt/printwithzwe-stack
docker compose --profile tools run --rm --no-deps certbot renew --webroot --webroot-path /var/www/acme
docker compose exec -T web nginx -s reload