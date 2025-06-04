# Rebuilding the Frontend

## Docker

### Removing Existing Docker Images:
```
docker rmi -f iaso-webpack:latest
```

### Build the new Docker image:
```
docker compose build --no-cache webpack
```



## Local
### Removing node_modules:
```
rm -rf node_modules
```

###  Clean npm cache:
```
npm cache clean --force
```
###  Reinstall npm packages:
```
npm ci
```
