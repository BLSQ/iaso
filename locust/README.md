# Stress testing

This folder contains what is needed to stress test Iaso simulating 
users who are going to synchronize sometimes and upload often.

## Locust

The tool used is [Locust](https://locust.io) as it is written in Python
and allows a lot of flexibility.

## Running in Docker

https://docs.locust.io/en/stable/running-in-docker.html

```shell
docker-compose up --scale worker=4
```