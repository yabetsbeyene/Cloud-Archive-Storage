import Keycloak from 'keycloak-js'

/**
 * A single shared Keycloak instance for the whole app.
 * keycloak-js manages its own internal state (tokens, refresh timers), so we
 * don't want more than one instance — this module pattern guarantees that.
 */
const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL,
  realm: import.meta.env.VITE_KEYCLOAK_REALM,
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
})

export default keycloak
