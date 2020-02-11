# Digital Points API Server

Public API for modifying Digital Points Geometry

## Setting up


## Docker Support

Building the docker image
```
export TAG=2
docker build -t digitalpoints/api:production-$TAG .
```

Running the docker image
```
docker run -p 8888:8888 -it digitalpoints/api:production-$TAG
```

Deploying
```
docker push digitalpoints/api:production-$TAG
kubectl set image deployment/api-deployment api=digitalpoints/api:production-$TAG
```



### Modules used
* graphql
* koa-graphql
* @koa-cors
* dotenv
* jsonwebtoken
* koa-jwt
* koa-router
* mongoose

### Directory Structure and important files

* auth - Auth related helper methods
* database - keeps models for mongoose into a separate *mongo* directory
* graphql - all the graphql related files stay here
* services - used to make more precise and compact services for busines logic (called from graphql resolvers)
* .env - stores all the environment related config
* app.js - initializes the database layer, middlewares, graphql and starts the server 


### Future additions
* Add a simple logger capabale of handling different log levels
