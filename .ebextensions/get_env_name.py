#!/usr/bin/env python

import boto.utils
import boto.ec2

iid_doc = boto.utils.get_instance_identity()['document']
region = iid_doc['region']
instance_id = iid_doc['instanceId']

ec2 = boto.ec2.connect_to_region(region)
instance = ec2.get_only_instances(instance_ids=[instance_id])[0]
env = instance.tags['elasticbeanstalk:environment-name']

print(env)
