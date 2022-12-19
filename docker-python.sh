#!/bin/bash
#
echo "List of all arg: $@"
docker-compose run iaso python $@
