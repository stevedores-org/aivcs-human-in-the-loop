#!/usr/bin/env bash
set -eu

CONFIG_JSON="/tmp/config.json"
CADDYFILE="/tmp/Caddyfile"

AIVCS_API_URL="${AIVCS_API_URL:-http://localhost:3000}"
SSO_ISSUER="${SSO_ISSUER:-https://auth.lornu.ai}"
OAUTH_CLIENT_ID="${OAUTH_CLIENT_ID:-aivcs-hitl}"
USE_MOCKS="${USE_MOCKS:-false}"
REQUIRE_AUTH="${REQUIRE_AUTH:-false}"
DEMO_MODE="${DEMO_MODE:-$USE_MOCKS}"

bool_json() {
  case "$1" in
    true|1|yes|TRUE|Yes|YES) printf 'true' ;;
    *) printf 'false' ;;
  esac
}

> "$CONFIG_JSON" <<EOF
{
  "apiUrl": "${AIVCS_API_URL}",
  "ssoIssuer": "${SSO_ISSUER}",
  "oauthClientId": "${OAUTH_CLIENT_ID}",
  "useMocks": $(bool_json "$USE_MOCKS"),
  "requireAuth": $(bool_json "$REQUIRE_AUTH"),
  "demoMode": $(bool_json "$DEMO_MODE")
}
EOF

> "$CADDYFILE" <<'EOF'
{
	admin off
	auto_https off
}

:3000 {
	handle /config.json {
		root * /tmp
		header Cache-Control "no-store"
		file_server
	}

	handle /assets/* {
		root * /srv
		header Cache-Control "public, max-age=31536000, immutable"
		file_server
	}

	handle {
		root * /srv
		encode gzip zstd
		try_files {path} /index.html
		file_server
	}
}
EOF

exec caddy run --config "$CADDYFILE"
