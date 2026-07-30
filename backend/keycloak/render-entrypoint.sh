#!/bin/bash
set -euo pipefail

# Render supplies postgres://user:password@host:port/database, but Keycloak
# expects jdbc:postgresql://host:port/database and separate credentials.
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

frontend_url="${FRONTEND_URL%/}"
realm_template="/opt/keycloak/data/import/realm-export.template"
realm_file="/opt/keycloak/data/import/realm-export.json"

: > "${realm_file}"
while IFS= read -r line || [[ -n "${line}" ]]; do
  line="${line//__FRONTEND_URL__/${frontend_url}}"
  printf '%s\n' "${line}" >> "${realm_file}"
done < "${realm_template}"

exec /opt/keycloak/bin/kc.sh start --optimized --import-realm "$@"
