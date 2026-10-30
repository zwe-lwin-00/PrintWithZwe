#!/usr/bin/env bash
set -euo pipefail
set -a
. /etc/printwithzwe-docker.env
set +a
exec 9>/run/lock/printwithzwe-deploy.lock
flock -n 9 || exit 0
project=$(docker inspect -f '{{ index .Config.Labels "com.docker.compose.project" }}' printwithzwe-web)
if [ -z "$project" ] || [ "$project" = '<no value>' ]; then
	printf 'Cannot determine the running Docker Compose project.\n' >&2
	exit 1
fi
compose=(docker compose --project-name "$project" -f /opt/printwithzwe-stack/compose.yaml)
"${compose[@]}" --profile tools run --rm --no-deps certbot renew "$@" --webroot --webroot-path /var/www/acme
"${compose[@]}" exec -T web nginx -c /tmp/nginx.conf -t
"${compose[@]}" exec -T web nginx -c /tmp/nginx.conf -s reload