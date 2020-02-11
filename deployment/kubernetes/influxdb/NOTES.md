### Notes

NAME:   influxdb
LAST DEPLOYED: Sat Jul 27 16:11:05 2019
NAMESPACE: default
STATUS: DEPLOYED
RESOURCES:
==> v1/ConfigMap
NAME      DATA  AGE
influxdb  1     1s
==> v1/PersistentVolumeClaim
NAME      STATUS   VOLUME    CAPACITY  ACCESS MODES  STORAGECLASS  AGE
influxdb  Pending  standard  1s
==> v1/Pod(related)
NAME                       READY  STATUS   RESTARTS  AGE
influxdb-5994b5598b-78rtr  0/1    Pending  0         1s
==> v1/Service
NAME      TYPE       CLUSTER-IP  EXTERNAL-IP  PORT(S)            AGE
influxdb  ClusterIP  10.44.1.32  <none>       8086/TCP,8088/TCP  1s
==> v1beta1/Deployment
NAME      READY  UP-TO-DATE  AVAILABLE  AGE
influxdb  0/1    1           0          1s
NOTES:
InfluxDB can be accessed via port 8086 on the following DNS name from within your cluster:
- http://influxdb.default:8086
You can easily connect to the remote instance with your local influx cli. To forward the API port to localhost:8086 run the following:
- kubectl port-forward --namespace default $(kubectl get pods --namespace default -l app=influxdb -o jsonpath='{ .items[0].metadata.name }') 8086:8086
You can also connect to the influx cli from inside the container. To open a shell session in the InfluxDB pod run the following:
- kubectl exec -i -t --namespace default $(kubectl get pods --namespace default -l app=influxdb -o jsonpath='{.items[0].metadata.name}') /bin/sh
To tail the logs for the InfluxDB pod run the following:
- kubectl logs -f --namespace default $(kubectl get pods --namespace default -l app=influxdb -o jsonpath='{ .items[0].metadata.name }')