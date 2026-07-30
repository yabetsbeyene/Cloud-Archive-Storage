#!/bin/bash
set -euo pipefail

# Render exposes these values automatically. Explicit KC_* values still win.
if [[ -z "${KC_HOSTNAME:-}" && -n "${RENDER_EXTERNAL_HOSTNAME:-}" ]]; then
  export KC_HOSTNAME="${RENDER_EXTERNAL_HOSTNAME}"
fi

if [[ -z "${KC_HTTP_PORT:-}" && -n "${PORT:-}" ]]; then
  export KC_HTTP_PORT="${PORT}"
fi

# Keep manually configured Keycloak 25 services compatible after upgrading.
if [[ -z "${KC_BOOTSTRAP_ADMIN_USERNAME:-}" && -n "${KEYCLOAK_ADMIN:-}" ]]; then
  export KC_BOOTSTRAP_ADMIN_USERNAME="${KEYCLOAK_ADMIN}"
fi

if [[ -z "${KC_BOOTSTRAP_ADMIN_PASSWORD:-}" && -n "${KEYCLOAK_ADMIN_PASSWORD:-}" ]]; then
  export KC_BOOTSTRAP_ADMIN_PASSWORD="${KEYCLOAK_ADMIN_PASSWORD}"
fi

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
