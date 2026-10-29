#!/usr/bin/env bash
set -euo pipefail
umask 077

: "${RESTIC_REPOSITORY:?Configure an off-server restic repository}"
: "${RESTIC_PASSWORD_FILE:?Configure a root-only restic password file}"
command -v restic >/dev/null
command -v sqlite3 >/dev/null
exec 9>/run/lock/printwithzwe-backup.lock
flock -n 9 || exit 1
stage=/var/cache/printwithzwe-backup
install -d -m 0700 "$stage"
stopped=0
cleanup() {
    if [ "$stopped" = 1 ]; then systemctl start printwithzwe; fi
    rm -rf -- "$stage"
}
trap cleanup EXIT
systemctl stop printwithzwe
stopped=1
sqlite3 /var/lib/printwithzwe/catalog.db ".backup '$stage/catalog.db'"
cp -a /var/lib/printwithzwe/uploads /var/lib/printwithzwe/keys "$stage/"
systemctl start printwithzwe
stopped=0
restic backup --tag printwithzwe "$stage"