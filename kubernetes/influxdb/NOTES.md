### Notes
NAME:   quiet-bronco
LAST DEPLOYED: Fri Jul 26 20:25:49 2019
NAMESPACE: default
STATUS: DEPLOYED
RESOURCES:
==> v1/ConfigMap
NAME                   DATA  AGE
quiet-bronco-influxdb  1     0s
==> v1/PersistentVolumeClaim
NAME                   STATUS   VOLUME    CAPACITY  ACCESS MODES  STORAGECLASS  AGE
quiet-bronco-influxdb  Pending  standard  0s
==> v1/Pod(related)
NAME                                   READY  STATUS   RESTARTS  AGE
quiet-bronco-influxdb-98467bcc4-k76fx  0/1    Pending  0         0s
==> v1/Service
NAME                   TYPE       CLUSTER-IP   EXTERNAL-IP  PORT(S)            AGE
quiet-bronco-influxdb  ClusterIP  10.44.9.253  <none>       8086/TCP,8088/TCP  0s
==> v1beta1/Deployment
NAME                   READY  UP-TO-DATE  AVAILABLE  AGE
quiet-bronco-influxdb  0/1    1           0          0s
NOTES:
InfluxDB can be accessed via port 8086 on the following DNS name from within your cluster:
- http://quiet-bronco-influxdb.default:8086
You can easily connect to the remote instance with your local influx cli. To forward the API port to localhost:8086 run the following:
- kubectl port-forward --namespace default $(kubectl get pods --namespace default -l app=quiet-bronco-influxdb -o jsonpath='{ .items[0].metadata.name }') 8086:8086
You can also connect to the influx cli from inside the container. To open a shell session in the InfluxDB pod run the following:
- kubectl exec -i -t --namespace default $(kubectl get pods --namespace default -l app=quiet-bronco-influxdb -o jsonpath='{.items[0].metadata.name}') /bin/sh
To tail the logs for the InfluxDB pod run the following:
- kubectl logs -f --namespace default $(kubectl get pods --namespace default -l app=quiet-bronco-influxdb -o jsonpath='{ .items[0].metadata.name }')