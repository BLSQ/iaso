#!/bin/bash
cd /opt/python/current/app
source /opt/python/current/env
source /opt/python/run/venv/bin/activate
date |gzip -c>> /home/ec2-user/import_devices.log.gz
./manage.py importdevices 2>&1 |gzip -c>> /home/ec2-user/import_devices.log.gz
