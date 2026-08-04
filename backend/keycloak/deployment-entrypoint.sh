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

if [[ -z "${KC_BOOTSTRAP_ADMIN_USERNAME:-}" || -z "${KC_BOOTSTRAP_ADMIN_PASSWORD:-}" ]]; then
  echo "KC_BOOTSTRAP_ADMIN_USERNAME and KC_BOOTSTRAP_ADMIN_PASSWORD must be configured" >&2
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

# Startup realm imports intentionally do not overwrite an existing realm. Start
# Keycloak first, then synchronize the SMTP settings so changing environment
# variables also updates installations that already have users and documents.
/opt/keycloak/bin/kc.sh start --optimized --import-realm "$@" &
keycloak_pid=$!

forward_signal() {
  kill -TERM "${keycloak_pid}" 2>/dev/null || true
}
trap forward_signal TERM INT

relative_path="${KC_HTTP_RELATIVE_PATH:-/auth}"
relative_path="/${relative_path#/}"
relative_path="${relative_path%/}"
local_server="http://127.0.0.1:${KC_HTTP_PORT:-8080}${relative_path}"
kcadm_config="/tmp/archive-kcadm.config"

authenticated=false
for _ in $(seq 1 90); do
  if ! kill -0 "${keycloak_pid}" 2>/dev/null; then
    wait "${keycloak_pid}"
    exit $?
  fi

  if /opt/keycloak/bin/kcadm.sh config credentials \
      --config "${kcadm_config}" \
      --server "${local_server}" \
      --realm master \
      --user "${KC_BOOTSTRAP_ADMIN_USERNAME}" \
      --password "${KC_BOOTSTRAP_ADMIN_PASSWORD}" >/dev/null 2>&1; then
    authenticated=true
    break
  fi

  sleep 2
done

if [[ "${authenticated}" != "true" ]]; then
  echo "Keycloak started, but runtime realm configuration could not be authenticated" >&2
  kill -TERM "${keycloak_pid}" 2>/dev/null || true
  wait "${keycloak_pid}" || true
  exit 1
fi

/opt/keycloak/bin/kcadm.sh update realms/digital-archive \
  --config "${kcadm_config}" \
  -s "smtpServer.host=${SMTP_HOST}" \
  -s "smtpServer.port=${SMTP_PORT}" \
  -s "smtpServer.from=${SMTP_FROM}" \
  -s "smtpServer.fromDisplayName=${SMTP_FROM_DISPLAY_NAME}" \
  -s "smtpServer.auth=${SMTP_AUTH}" \
  -s "smtpServer.starttls=${SMTP_STARTTLS}" \
  -s "smtpServer.ssl=${SMTP_SSL}" \
  -s "smtpServer.user=${SMTP_USER}" \
  -s "smtpServer.password=${SMTP_PASSWORD}" >/dev/null

rm -f "${kcadm_config}"
echo "Realm SMTP configuration synchronized for ${SMTP_HOST}:${SMTP_PORT}"

wait "${keycloak_pid}"
