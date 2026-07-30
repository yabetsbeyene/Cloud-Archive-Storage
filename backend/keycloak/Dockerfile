FROM quay.io/keycloak/keycloak:26.6.0 AS builder

ENV KC_DB=postgres
ENV KC_HEALTH_ENABLED=true
ENV KC_METRICS_ENABLED=true

WORKDIR /opt/keycloak
RUN /opt/keycloak/bin/kc.sh build

FROM quay.io/keycloak/keycloak:26.6.0

COPY --from=builder /opt/keycloak/ /opt/keycloak/
COPY --chown=1000:0 realm-export.json /opt/keycloak/data/import/realm-export.template
COPY --chown=1000:0 --chmod=0755 render-entrypoint.sh /opt/keycloak/bin/render-entrypoint.sh

ENV KC_DB=postgres
ENV KC_HEALTH_ENABLED=true
ENV KC_METRICS_ENABLED=true
ENV KC_HTTP_ENABLED=true
ENV KC_PROXY_HEADERS=xforwarded
ENV KC_HTTP_MANAGEMENT_HEALTH_ENABLED=false
ENV KC_CACHE=local

EXPOSE 10000

ENTRYPOINT ["/opt/keycloak/bin/render-entrypoint.sh"]
