#!/usr/bin/env bash
set -eu

if [[ $# -lt 2 ]]; then
    echo "Usage: $0 <email> <password>"
    exit 1
fi

base_url="${BASE_URL:-http://localhost:8080}"
email="$1"
password="$2"

curl --include --request POST "$base_url/auth/register" \
    --header 'Content-Type: application/json' \
    --data "{\"email\":\"$email\",\"password\":\"$password\"}"
