FROM ghcr.io/blsq/iaso:cdcd372f437162293111d59f7e2da45bdb573f62

EXPOSE 8081

ENTRYPOINT ./entrypoint.sh start
