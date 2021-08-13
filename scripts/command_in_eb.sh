#!/usr/bin/env bash
# FIXME will probably need rework in the new eb for 3.8
# FIXME Hardcoded polio
set -e
set  -o allexport
cd /opt/python/current/app/
source /opt/python/current/env
if [[  $1 != "refresh_preparedness_data" || $PLUGINS  =~ "polio" ]]; then
  python ./manage.py "$@"
else
  echo "cannot execute " "$@"
fi
set  +o allexport
