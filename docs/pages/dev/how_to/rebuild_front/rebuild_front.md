# Rebuilding the Frontend

## Docker

    1. Removing Existing Docker Images:
```
docker rmi -f iaso-webpack:latest
```

    2. Build the new Docker image:
```
docker-compose build --no-cache webpack
```



## Local
    1. Removing node_modules:
```
rm -rf node_modules
```

    2. Clean npm cache:
```
npm cache clean --force
```
    3. Reinstall npm packages:
```
npm ci --legacy-peer-deps
```
