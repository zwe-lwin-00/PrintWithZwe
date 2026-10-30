#!/usr/bin/env bash
set -euo pipefail
umask 077

if [ "$(id -u)" -ne 0 ]; then
    printf 'Run this command as root.\n' >&2
    exit 1
fi

root=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
cd "$root"
if [ -n "$(git status --porcelain)" ]; then
    printf 'Repository has uncommitted changes. Commit or preserve them before deploying.\n' >&2
    exit 1
fi

for command in docker git curl flock systemctl; do
    command -v "$command" >/dev/null
done
docker compose version >/dev/null
exec 9>/run/lock/printwithzwe-deploy.lock
flock -n 9 || { printf 'Another deployment is already running.\n' >&2; exit 1; }

if [ "$(docker inspect -f '{{.State.Running}}' printwithzwe-api 2>/dev/null || true)" != true ] ||
   [ "$(docker inspect -f '{{.State.Running}}' printwithzwe-web 2>/dev/null || true)" != true ]; then
    printf 'The Docker stack is not running. Follow the first-cutover procedure in README.md.\n' >&2
    exit 1
fi
project=$(docker inspect -f '{{ index .Config.Labels "com.docker.compose.project" }}' printwithzwe-api)
web_project=$(docker inspect -f '{{ index .Config.Labels "com.docker.compose.project" }}' printwithzwe-web)
if [ -z "$project" ] || [ "$project" = '<no value>' ] || [ "$project" != "$web_project" ]; then
    printf 'The running containers do not belong to the same Compose project. Deployment was not started.\n' >&2
    exit 1
fi
if [ ! -f /etc/printwithzwe-docker.env ] || [ ! -f /opt/printwithzwe-stack/compose.yaml ]; then
    printf 'Docker deployment configuration is missing; complete the first cutover first.\n' >&2
    exit 1
fi
if [ ! -f /etc/printwithzwe-backup.env ] || [ ! -x /usr/local/sbin/printwithzwe-backup ]; then
    printf 'The encrypted backup is not configured. Deployment was not started.\n' >&2
    exit 1
fi
if ! grep -Eq '^PZW_BACKUP_MODE=docker$' /etc/printwithzwe-backup.env; then
    printf 'Set PZW_BACKUP_MODE=docker in the root-only backup configuration.\n' >&2
    exit 1
fi

export PZW_UID="$(id -u printwithzwe)"
export PZW_GID="$(getent group www-data | cut -d: -f3)"
export PZW_IMAGE_TAG="$(git rev-parse --short=12 HEAD)"
compose=(docker compose --project-name "$project" -f "$root/compose.yaml")
"${compose[@]}" config --quiet

if [ "${PZW_SKIP_BUILD:-0}" = 1 ]; then
    docker image inspect "printwithzwe-api:$PZW_IMAGE_TAG" "printwithzwe-web:$PZW_IMAGE_TAG" >/dev/null
else
    printf 'Building images on the VPS, one at a time. This can temporarily increase memory usage.\n'
    "${compose[@]}" build api
    "${compose[@]}" build web
fi

printf 'Running the configured encrypted backup before deployment.\n'
systemctl start printwithzwe-backup.service

state=/opt/printwithzwe-stack
previous="$state/previous-$(date -u +%Y%m%dT%H%M%SZ)"
install -d -m 0700 "$previous"
cp -a "$state/compose.yaml" "$previous/compose.yaml"
cp -a /etc/printwithzwe-docker.env "$previous/docker.env"

printf 'Starting release %s.\n' "$PZW_IMAGE_TAG"
if ! "${compose[@]}" up -d --no-build; then
    printf 'Container update failed. Inspect logs; previous configuration is saved in %s.\n' "$previous" >&2
    exit 1
fi
if ! curl -fsS --retry 10 --retry-delay 2 --retry-connrefused --retry-all-errors --max-time 5 https://okayselling.shop/api/health >/dev/null; then
    printf 'Health check failed. Inspect logs; previous configuration is saved in %s. Do not restore the database blindly.\n' "$previous" >&2
    exit 1
fi

install -m 0600 "$root/compose.yaml" "$state/compose.yaml"
env_file=$(mktemp /etc/printwithzwe-docker.env.XXXXXX)
printf 'PZW_UID=%s\nPZW_GID=%s\nPZW_IMAGE_TAG=%s\n' "$PZW_UID" "$PZW_GID" "$PZW_IMAGE_TAG" > "$env_file"
chmod 0600 "$env_file"
mv "$env_file" /etc/printwithzwe-docker.env
printf 'Release %s is healthy. Verify login, products, images and backup monitoring.\n' "$PZW_IMAGE_TAG"