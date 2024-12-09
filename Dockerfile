FROM ghcr.io/blsq/iaso:ad4f8be8533b6817619b10a2f0780e79eeb77ef5
EXPOSE 8081

ENTRYPOINT ./entrypoint.sh start_gunicorn
