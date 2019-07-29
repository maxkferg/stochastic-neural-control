# DigitalPoints User Interface

This is a Create React App site modified to include TypeScript and BabylonJS.

This project was bootstrapped with [Create React App](https://github.com/facebookincubator/create-react-app).


## Docker Support

```
export TAG=1
docker build -t digitalpoints/ui:production-$TAG .
```

Testing the image
```
docker run -p 80:80 digitalpoints/ui:production-$TAG
```

Deploying the image
```
docker push digitalpoints/ui:production-$TAG
kubectl set image deployment/ui-deployment ui=digitalpoints/ui:production-$TAG
```

# License
MIT