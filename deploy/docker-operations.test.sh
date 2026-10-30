#!/usr/bin/env bash
set -euo pipefail

if [ "${PZW_TEST_CONTAINER:-0}" != 1 ]; then
    printf 'Run only in a disposable container with PZW_TEST_CONTAINER=1. See README.md.\n' >&2
    exit 1
fi

mkdir -p /opt/printwithzwe-stack /usr/local/sbin /run/lock
printf '#!/bin/sh\n' > /usr/local/sbin/printwithzwe-backup
chmod +x /usr/local/sbin/printwithzwe-backup
printf 'PZW_BACKUP_MODE=docker\n' > /etc/printwithzwe-backup.env
export PZW_RELEASE_TAG=release-test

git() {
    case "$*" in
        *--show-toplevel*) printf '/repo\n' ;;
        *status*) if [ "$TEST_MODE" = dirty-repo ]; then printf ' M file\n'; fi ;;
        *rev-parse*) printf 'abc123\n' ;;
    esac
}
docker() {
    printf 'docker %s\n' "$*" >> /tmp/test-calls
    case "$*" in
        *inspect*State.Running*) printf 'true\n' ;;
        *inspect*compose.project*) printf 'test-project\n' ;;
        *inspect*Config.Image*api*) printf 'printwithzwe-api:latest\n' ;;
        *inspect*Config.Image*web*) printf 'printwithzwe-web:latest\n' ;;
        *inspect*Image*api*) printf 'sha256:old-api\n' ;;
        *inspect*Image*web*) printf 'sha256:old-web\n' ;;
        *inspect*NetworkSettings*) printf '172.30.42.3\n' ;;
        *inspect*Config.Env*) printf 'AllowedHosts=example.test;www.example.test\n' ;;
        *' build api') if [ "$TEST_MODE" = build-failure ]; then return 1; fi ;;
        *'up -d --no-build --force-recreate') if [ "$TEST_MODE" = rollback-failure ]; then return 1; fi ;;
        *'up -d --no-build') if [ "$TEST_MODE" = update-failure ]; then return 1; fi ;;
        *'certbot renew'*) if [ "$TEST_MODE" = renew-failure ]; then return 1; fi ;;
    esac
}
systemctl() {
    printf 'systemctl %s\n' "$*" >> /tmp/test-calls
    if [ "$TEST_MODE" = backup-failure ]; then return 1; fi
}
curl() {
    printf 'curl %s\n' "$*" >> /tmp/test-calls
    count=$(wc -l < /tmp/curl-count)
    printf 'call\n' >> /tmp/curl-count
    case "$TEST_MODE" in
        unhealthy|backup-unready) return 7 ;;
        health-failure|rollback-failure) if [ "$count" = 1 ]; then return 22; fi ;;
    esac
}
restic() { printf 'restic %s\n' "$*" >> /tmp/test-calls; }
sqlite3() { printf 'sqlite3 %s\n' "$*" >> /tmp/test-calls; }
export -f git docker systemctl curl restic sqlite3

reset_fixture() {
    printf 'PZW_UID=999\nPZW_GID=33\nPZW_IMAGE_TAG=latest\nPZW_PRIMARY_DOMAIN=example.test\nPZW_ALLOWED_HOSTS="example.test;www.example.test"\nPZW_CERT_ROOT=/etc/letsencrypt\nCUSTOM_SETTING=keep-me\n' > /etc/printwithzwe-docker.env
    printf 'services: {}\n' > /opt/printwithzwe-stack/compose.yaml
    : > /tmp/test-calls
    : > /tmp/curl-count
}

for TEST_MODE in dirty-repo unhealthy build-failure backup-failure update-failure health-failure rollback-failure success; do
    export TEST_MODE
    reset_fixture
    result=0
    bash /repo/deploy/docker-deploy.sh > /tmp/test-output 2>&1 || result=$?
    if [ "$TEST_MODE" = success ]; then
        test "$result" = 0
        grep -q '^CUSTOM_SETTING=keep-me$' /etc/printwithzwe-docker.env
        grep -q '^PZW_ALLOWED_HOSTS="example.test;www.example.test"$' /etc/printwithzwe-docker.env
        grep -q '^PZW_IMAGE_TAG=release-test$' /etc/printwithzwe-docker.env
        cmp /repo/deploy/backup.sh /usr/local/sbin/printwithzwe-backup
        cmp /repo/deploy/docker-cert-renew.sh /usr/local/sbin/printwithzwe-cert-renew
    else
        test "$result" != 0
        case "$TEST_MODE" in
            dirty-repo|unhealthy|build-failure|backup-failure)
                ! grep -q ' up ' /tmp/test-calls
                ;;
            update-failure|health-failure|rollback-failure)
                grep -q 'docker tag sha256:old-api printwithzwe-api:latest' /tmp/test-calls
                grep -q 'docker tag sha256:old-web printwithzwe-web:latest' /tmp/test-calls
                grep -q 'up -d --no-build --force-recreate' /tmp/test-calls
                grep -q '^PZW_IMAGE_TAG=latest$' /etc/printwithzwe-docker.env
                if [ "$TEST_MODE" = rollback-failure ]; then
                    grep -q 'Docker rollback failed' /tmp/test-output
                    ! grep -q 'Previous Docker release is healthy' /tmp/test-output
                else
                    grep -q 'Previous Docker release is healthy' /tmp/test-output
                fi
                ;;
        esac
    fi
    ! grep -q 'systemctl start printwithzwe nginx' /tmp/test-calls
    ! grep -q ' down' /tmp/test-calls
    printf 'PASS: deployment %s\n' "$TEST_MODE"
done

export TEST_MODE=backup-unready
export RESTIC_REPOSITORY=/tmp/test-restic RESTIC_PASSWORD_FILE=/tmp/test-password PZW_BACKUP_MODE=docker
reset_fixture
result=0
bash /repo/deploy/backup.sh > /tmp/test-output 2>&1 || result=$?
test "$result" != 0
! grep -q 'docker stop' /tmp/test-calls
! grep -q '^sqlite3' /tmp/test-calls
! grep -q '^restic' /tmp/test-calls
printf 'PASS: backup does not interrupt API startup\n'

for TEST_MODE in renew-failure renew-success; do
    export TEST_MODE
    reset_fixture
    result=0
    bash /repo/deploy/docker-cert-renew.sh --dry-run > /tmp/test-output 2>&1 || result=$?
    grep -q -- '--project-name test-project' /tmp/test-calls
    grep -q -- 'certbot renew --dry-run' /tmp/test-calls
    grep -q -- '--logs-dir /etc/letsencrypt/renewal-logs --max-log-backups 5' /tmp/test-calls
    if [ "$TEST_MODE" = renew-failure ]; then
        test "$result" != 0
        grep -q 'Log: /etc/letsencrypt/renewal-logs/letsencrypt.log' /tmp/test-output
        ! grep -q 'nginx .*reload' /tmp/test-calls
    else
        test "$result" = 0
        grep -q -- 'nginx -c /tmp/nginx.conf -t' /tmp/test-calls
        grep -q -- 'nginx -c /tmp/nginx.conf -s reload' /tmp/test-calls
    fi
    printf 'PASS: certificates %s\n' "$TEST_MODE"
done