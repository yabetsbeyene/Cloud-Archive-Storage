#!/bin/sh
set -eu

# Render provides a postgresql:// URL with embedded credentials. Spring's
# PostgreSQL driver expects jdbc:postgresql:// and receives credentials via
# separate environment variables from the Blueprint.
if [ -n "${DATABASE_URL:-}" ] && [ -z "${SPRING_DATASOURCE_URL:-}" ]; then
  connection_without_scheme="${DATABASE_URL#*://}"
  host_and_database="${connection_without_scheme##*@}"
  export SPRING_DATASOURCE_URL="jdbc:postgresql://${host_and_database}"
fi

if [ -n "${KEYCLOAK_HOSTNAME:-}" ] && [ -z "${KEYCLOAK_ISSUER_URI:-}" ]; then
  export KEYCLOAK_ISSUER_URI="https://${KEYCLOAK_HOSTNAME}/realms/digital-archive"
fi

if [ -n "${KEYCLOAK_HOSTNAME:-}" ] && [ -z "${KEYCLOAK_JWK_SET_URI:-}" ]; then
  export KEYCLOAK_JWK_SET_URI="https://${KEYCLOAK_HOSTNAME}/realms/digital-archive/protocol/openid-connect/certs"
fi

exec java -jar /app/app.jar "$@"
