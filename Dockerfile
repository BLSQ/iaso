FROM ghcr.io/blsq/iaso:624c39f36afeac03513c64ff5def45bd8c402693

EXPOSE 8081

ENTRYPOINT ./entrypoint.sh start_gunicorn
