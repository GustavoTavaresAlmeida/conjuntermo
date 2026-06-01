#!/usr/bin/env bash
set -a
source ~/.env.coolify
set +a

bash ~/.claude/skills/coolify-deploy/scripts/publish.sh \
  --name         "conjuntermo" \
  --subdomain    "conjuntermo" \
  --domain       "dots.dev.br" \
  --repo         "conjuntermo" \
  --project-uuid "ycc0sow04ggg0sso4o0ogckk" \
  --dir          "$(cd "$(dirname "$0")" && pwd)"
