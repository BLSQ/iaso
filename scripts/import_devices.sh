#!/bin/bash
cd /opt/python/current/app
source /opt/python/current/env
source /opt/python/run/venv/bin/activate
LOGDIR=/home/ec2-user/import_devices_logs
LOGFILE=${LOGDIR}/import_devices_$(date +%Y%m%d%H%M%S)_$$.log
mkdir -p /home/ec2-user/import_devices_logs
if [[ $(ps aux|grep "manage.py importdevices"|grep -v grep|wc -l) -eq 0 ]]; then
  date >> $LOGFILE
  ./manage.py importdevices 2>&1 >> ${LOGFILE}
fi
gzip -9 ${LOGFILE}