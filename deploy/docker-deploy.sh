#!/usr/bin/env bash
set -euo pipefail
umask 077

if [ "$(id -u)" -ne 0 ]; then
    printf 'Run this command as root.\n' >&2
    exit 1
fi

root=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
cd "$root"
if [ ! -r /etc/printwithzwe-docker.env ]; then
    printf 'Missing /etc/printwithzwe-docker.env. Complete Docker setup first.\n' >&2
    exit 1
fi
set -a
. /etc/printwithzwe-docker.env
set +a
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
curl -fsS --retry 10 --retry-delay 2 --retry-connrefused --retry-all-errors --max-time 5 "https://$PZW_PRIMARY_DOMAIN/api/health" >/dev/null

export PZW_UID="${PZW_UID:-$(id -u printwithzwe)}"
export PZW_GID="${PZW_GID:-$(getent group www-data | cut -d: -f3)}"
export PZW_IMAGE_TAG="${PZW_RELEASE_TAG:-$(git rev-parse --short=12 HEAD)-$(date -u +%Y%m%dT%H%M%SZ)}"
compose=(docker compose --project-name "$project" -f "$root/compose.yaml")
"${compose[@]}" config --quiet
for script in backup.sh docker-cert-renew.sh; do
    bash -n "$root/deploy/$script"
done

state=/opt/printwithzwe-stack
previous="$state/previous-$(date -u +%Y%m%dT%H%M%SZ)"
install -d -m 0700 "$previous"
cp -a "$state/compose.yaml" "$previous/compose.yaml"
cp -a /etc/printwithzwe-docker.env "$previous/docker.env"
cp -a /usr/local/sbin/printwithzwe-backup "$previous/backup.sh"
if [ -f /usr/local/sbin/printwithzwe-cert-renew ]; then
    cp -a /usr/local/sbin/printwithzwe-cert-renew "$previous/cert-renew.sh"
fi
api_image=$(docker inspect -f '{{.Image}}' printwithzwe-api)
web_image=$(docker inspect -f '{{.Image}}' printwithzwe-web)
api_reference=$(docker inspect -f '{{.Config.Image}}' printwithzwe-api)
web_reference=$(docker inspect -f '{{.Config.Image}}' printwithzwe-web)

rollback() {
    status=$?
    if [ "$status" -ne 0 ]; then
        trap - EXIT
        "${compose[@]}" logs --no-color --tail 100 > "$previous/failed-containers.log" 2>&1 || true
        printf 'Deployment failed; restoring the previous Docker release. Logs: %s/failed-containers.log\n' "$previous" >&2
        if (
            docker tag "$api_image" "$api_reference" || exit 1
            docker tag "$web_image" "$web_reference" || exit 1
            cp -a "$previous/docker.env" /etc/printwithzwe-docker.env || exit 1
            cp -a "$previous/compose.yaml" "$state/compose.yaml" || exit 1
            cp -a "$previous/backup.sh" /usr/local/sbin/printwithzwe-backup || exit 1
            if [ -f "$previous/cert-renew.sh" ]; then
                cp -a "$previous/cert-renew.sh" /usr/local/sbin/printwithzwe-cert-renew || exit 1
            fi
            set -a
            . /etc/printwithzwe-docker.env || exit 1
            set +a
            docker compose --project-name "$project" --project-directory "$root" -f "$state/compose.yaml" up -d --no-build --force-recreate || exit 1
            curl -fsS --retry 10 --retry-delay 2 --retry-connrefused --retry-all-errors --max-time 5 "https://$PZW_PRIMARY_DOMAIN/api/health" >/dev/null
        ); then
            printf 'Previous Docker release is healthy.\n' >&2
        else
            printf 'Docker rollback failed. Inspect %s before further changes.\n' "$previous" >&2
        fi
    fi
    exit "$status"
}

if [ "${PZW_SKIP_BUILD:-0}" = 1 ]; then
    docker image inspect "printwithzwe-api:$PZW_IMAGE_TAG" "printwithzwe-web:$PZW_IMAGE_TAG" >/dev/null
else
    printf 'Building images on the VPS, one at a time. This can temporarily increase memory usage.\n'
    "${compose[@]}" build api
    "${compose[@]}" build web
fi

printf 'Running the configured encrypted backup before deployment.\n'
systemctl start printwithzwe-backup.service
printf 'Waiting for the existing API to recover from the backup restart.\n'
curl -fsS --retry 30 --retry-delay 2 --retry-connrefused --retry-all-errors --max-time 5 "https://$PZW_PRIMARY_DOMAIN/api/health" >/dev/null

printf 'Starting release %s.\n' "$PZW_IMAGE_TAG"
trap rollback EXIT
if ! "${compose[@]}" up -d --no-build; then
    printf 'Container update failed. Inspect logs; previous configuration is saved in %s.\n' "$previous" >&2
    exit 1
fi
if ! curl -fsS --retry 10 --retry-delay 2 --retry-connrefused --retry-all-errors --max-time 5 "https://$PZW_PRIMARY_DOMAIN/api/health" >/dev/null; then
    printf 'Health check failed. Inspect logs; previous configuration is saved in %s. Do not restore the database blindly.\n' "$previous" >&2
    exit 1
fi

install -m 0600 "$root/compose.yaml" "$state/compose.yaml"
install -m 0750 "$root/deploy/backup.sh" /usr/local/sbin/printwithzwe-backup
install -m 0750 "$root/deploy/docker-cert-renew.sh" /usr/local/sbin/printwithzwe-cert-renew
env_file=$(mktemp /etc/printwithzwe-docker.env.XXXXXX)
cp /etc/printwithzwe-docker.env "$env_file"
sed -i '/^PZW_IMAGE_TAG=/d' "$env_file"
printf '\nPZW_IMAGE_TAG=%s\n' "$PZW_IMAGE_TAG" >> "$env_file"
chmod 0600 "$env_file"
mv "$env_file" /etc/printwithzwe-docker.env
trap - EXIT
printf 'Release %s is healthy. Verify login, products, images and backup monitoring.\n' "$PZW_IMAGE_TAG"