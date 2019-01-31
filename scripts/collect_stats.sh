#!/bin/bash
cd /opt/python/current/app
source /opt/python/current/env
source /opt/python/run/venv/bin/activate
echo '*****************************************************************************' >> /home/ec2-user/collect_stats.log
date >> /home/ec2-user/collect_stats.log
./manage.py snapshot_unmatched_village_count >> /home/ec2-user/collect_stats.log 2>&1
./manage.py snapshot_case_count >> /home/ec2-user/collect_stats.log 2>&1
./manage.py snapshot_patient_duplicates >> /home/ec2-user/collect_stats.log 2>&1