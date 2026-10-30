#!/bin/sh
set -eu

: "${PZW_PRIMARY_DOMAIN:?PZW_PRIMARY_DOMAIN is required}"
: "${PZW_WWW_DOMAIN:?PZW_WWW_DOMAIN is required}"
: "${PZW_CERT_NAME:?PZW_CERT_NAME is required}"
: "${PZW_API_PROXY_HOST:?PZW_API_PROXY_HOST is required}"
: "${PZW_MAX_REQUEST_BODY:?PZW_MAX_REQUEST_BODY is required}"

envsubst '${PZW_PRIMARY_DOMAIN} ${PZW_WWW_DOMAIN} ${PZW_CERT_NAME} ${PZW_API_PROXY_HOST} ${PZW_MAX_REQUEST_BODY}' \
  < /etc/nginx/nginx.conf.template > /tmp/nginx.conf
exec nginx -c /tmp/nginx.conf -g 'daemon off;'