#!/bin/bash
set -euo pipefail

if [[ -z "${KC_HTTP_PORT:-}" && -n "${PORT:-}" ]]; then
  export KC_HTTP_PORT="${PORT}"
fi

# Some hosting environments supply postgres://user:password@host:port/database,
# while Keycloak expects a JDBC URL and separate credentials.
if [[ -z "${KC_DB_URL:-}" ]]; then
  if [[ -z "${DATABASE_URL:-}" ]]; then
    echo "DATABASE_URL or KC_DB_URL must be configured" >&2
    exit 1
  fi

  connection_without_scheme="${DATABASE_URL#*://}"
  host_and_database="${connection_without_scheme##*@}"
  export KC_DB_URL="jdbc:postgresql://${host_and_database}"
fi

if [[ -z "${KC_DB_USERNAME:-}" || -z "${KC_DB_PASSWORD:-}" ]]; then
  echo "KC_DB_USERNAME and KC_DB_PASSWORD must be configured" >&2
  exit 1
fi

if [[ -z "${FRONTEND_URL:-}" ]]; then
  echo "FRONTEND_URL must be configured" >&2
  exit 1
fi

if [[ -z "${KEYCLOAK_ADMIN_CLIENT_SECRET:-}" ]]; then
  echo "KEYCLOAK_ADMIN_CLIENT_SECRET must be configured" >&2
  exit 1
fi

if [[ -z "${SMTP_HOST:-}" || -z "${SMTP_PORT:-}" || -z "${SMTP_FROM:-}" ]]; then
  echo "SMTP_HOST, SMTP_PORT, and SMTP_FROM must be configured" >&2
  exit 1
fi

if [[ "${SMTP_AUTH:-false}" == "true" \
    && ( -z "${SMTP_USER:-}" || -z "${SMTP_PASSWORD:-}" ) ]]; then
  echo "SMTP_USER and SMTP_PASSWORD are required when SMTP_AUTH=true" >&2
  exit 1
fi

export SMTP_FROM_DISPLAY_NAME="${SMTP_FROM_DISPLAY_NAME:-Digital Archive}"
export SMTP_AUTH="${SMTP_AUTH:-false}"
export SMTP_STARTTLS="${SMTP_STARTTLS:-false}"
export SMTP_SSL="${SMTP_SSL:-false}"
export SMTP_USER="${SMTP_USER:-}"
export SMTP_PASSWORD="${SMTP_PASSWORD:-}"

frontend_url="${FRONTEND_URL%/}"
realm_template="/opt/keycloak/data/import/realm-export.template"
realm_file="/opt/keycloak/data/import/realm-export.json"

: > "${realm_file}"
while IFS= read -r line || [[ -n "${line}" ]]; do
  line="${line//__FRONTEND_URL__/${frontend_url}}"
  line="${line//__BACKEND_ADMIN_CLIENT_SECRET__/${KEYCLOAK_ADMIN_CLIENT_SECRET}}"
  printf '%s\n' "${line}" >> "${realm_file}"
done < "${realm_template}"

exec /opt/keycloak/bin/kc.sh start --optimized --import-realm "$@"
