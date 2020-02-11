# Kafka Deployment

```
helm install incubator/kafka --name kafka -f values.yaml
```

```
helm upgrade kafka  -f values.yaml incubator/kafka