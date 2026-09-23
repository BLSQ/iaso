# Stress testing

This folder contains what is needed to stress test Iaso simulating 
users who are going to synchronize sometimes and upload often.

## Locust

The tool used is [Locust](https://locust.io) as it is written in Python
and allows a lot of flexibility.

`IasoUser.browse_org_units_v3` load-tests `/api/v3/orgunits/` (plain list, filtered list, `fields=` with
`ancestors(...)`, `format=csv`, and a large `page_size` pull) alongside the existing mobile-sync
(`download`/`upload`) tasks.

## Running in Docker

https://docs.locust.io/en/stable/running-in-docker.html

```shell
docker compose up --scale worker=4
```