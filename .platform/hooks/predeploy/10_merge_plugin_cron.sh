#!/bin/bash
# sqsd reads /var/app/current/cron.yaml. Append each enabled plugin's cron.yaml
# before this staging tree is published.
set -euo pipefail

PLUGINS_VALUE="${PLUGINS:-}"
if [[ -x /opt/elasticbeanstalk/bin/get-config ]]; then
    FROM_EB="$(/opt/elasticbeanstalk/bin/get-config environment -k PLUGINS || true)"
    if [[ -n "${FROM_EB}" ]]; then
        PLUGINS_VALUE="${FROM_EB}"
    fi
fi

python3 scripts/merge_plugin_cron.py --plugins "${PLUGINS_VALUE}" --write cron.yaml
