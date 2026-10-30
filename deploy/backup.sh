#!/usr/bin/env bash
set -euo pipefail
umask 077

: "${RESTIC_REPOSITORY:?Configure an off-server restic repository}"
: "${RESTIC_PASSWORD_FILE:?Configure a root-only restic password file}"
command -v restic >/dev/null
command -v sqlite3 >/dev/null
mode=${PZW_BACKUP_MODE:-systemd}
case "$mode" in
    systemd) systemctl is-active --quiet printwithzwe ;;
    docker)
        command -v docker >/dev/null
        [ "$(docker inspect -f '{{.State.Running}}' printwithzwe-api)" = true ]
        ;;
    *) printf 'Invalid PZW_BACKUP_MODE: use systemd or docker\n' >&2; exit 1 ;;
esac
exec 9>/run/lock/printwithzwe-backup.lock
flock -n 9 || exit 1
stage=/var/cache/printwithzwe-backup
install -d -m 0700 "$stage"
stopped=0
start_api() {
    if [ "$mode" = docker ]; then docker start printwithzwe-api >/dev/null; else systemctl start printwithzwe; fi
}
cleanup() {
    if [ "$stopped" = 1 ]; then start_api; fi
    rm -rf -- "$stage"
}
trap cleanup EXIT
if [ "$mode" = docker ]; then docker stop printwithzwe-api >/dev/null; else systemctl stop printwithzwe; fi
stopped=1
sqlite3 /var/lib/printwithzwe/catalog.db ".backup '$stage/catalog.db'"
cp -a /var/lib/printwithzwe/uploads /var/lib/printwithzwe/keys "$stage/"
start_api
stopped=0
restic backup --tag printwithzwe "$stage"