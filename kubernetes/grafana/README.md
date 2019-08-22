# Grafana Deployment

```sh
helm install stable/grafana --name grafana -f values.yaml
```

```sh
helm upgrade grafana  -f values.yaml stable/grafana
```