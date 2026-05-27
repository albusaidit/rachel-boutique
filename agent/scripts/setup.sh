#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 is required but not on PATH." >&2
  exit 1
fi

if [ ! -d .venv ]; then
  echo "Creating virtualenv in .venv ..."
  python3 -m venv .venv
fi

# shellcheck disable=SC1091
source .venv/bin/activate

pip install --upgrade pip >/dev/null
pip install -r requirements.txt

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example — edit it and add your tokens."
fi

echo
echo "Done. Next steps:"
echo "  1. Edit .env with your BRIGHTDATA_API_TOKEN and SLACK_WEBHOOK_URL"
echo "  2. Edit watchlist.yaml with products to monitor"
echo "  3. Run:   source .venv/bin/activate && python3 agent.py"
