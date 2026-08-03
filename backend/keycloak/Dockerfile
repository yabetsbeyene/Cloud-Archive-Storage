FROM alpine:3.21 AS scripts

COPY deployment-entrypoint.sh /tmp/deployment-entrypoint.sh
RUN sed -i 's/\r$//' /tmp/deployment-entrypoint.sh && chmod 0755 /tmp/deployment-entrypoint.sh

FROM quay.io/keycloak/keycloak:26.6.0 AS builder

ENV KC_DB=postgres
ENV KC_HEALTH_ENABLED=true
ENV KC_METRICS_ENABLED=true
ENV KC_HTTP_MANAGEMENT_HEALTH_ENABLED=false
ENV KC_HTTP_RELATIVE_PATH=/auth

WORKDIR /opt/keycloak
RUN /opt/keycloak/bin/kc.sh build

FROM quay.io/keycloak/keycloak:26.6.0

COPY --from=builder /opt/keycloak/ /opt/keycloak/
COPY --chown=1000:0 realm-export.json /opt/keycloak/data/import/realm-export.template
COPY --chown=1000:0 themes/archive-invitation /opt/keycloak/themes/archive-invitation
COPY --from=scripts --chown=1000:0 /tmp/deployment-entrypoint.sh /opt/keycloak/bin/deployment-entrypoint.sh

ENV KC_DB=postgres
ENV KC_HEALTH_ENABLED=true
ENV KC_METRICS_ENABLED=true
ENV KC_HTTP_ENABLED=true
ENV KC_PROXY_HEADERS=xforwarded
ENV KC_HTTP_MANAGEMENT_HEALTH_ENABLED=false
ENV KC_HTTP_RELATIVE_PATH=/auth
ENV KC_CACHE=local

EXPOSE 8080

ENTRYPOINT ["/opt/keycloak/bin/deployment-entrypoint.sh"]
