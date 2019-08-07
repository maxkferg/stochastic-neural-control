# Kafka Deployment

```
helm install stable/grafana --name grafana -f values.yaml
```

```
helm upgrade grafana  -f values.yaml stable/grafana