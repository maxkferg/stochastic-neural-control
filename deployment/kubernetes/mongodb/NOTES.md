NAME:   mongodb
LAST DEPLOYED: Mon Sep  9 12:43:04 2019
NAMESPACE: default
STATUS: DEPLOYED
RESOURCES:
==> v1/PersistentVolumeClaim
NAME     STATUS   VOLUME    CAPACITY  ACCESS MODES  STORAGECLASS  AGE
mongodb  Pending  standard  0s
==> v1/Pod(related)
NAME                      READY  STATUS   RESTARTS  AGE
mongodb-5dc45448b4-bdcfq  0/1    Pending  0         0s
==> v1/Secret
NAME     TYPE    DATA  AGE
mongodb  Opaque  1     0s
==> v1/Service
NAME     TYPE       CLUSTER-IP   EXTERNAL-IP  PORT(S)    AGE
mongodb  ClusterIP  10.44.0.149  <none>       27017/TCP  0s
==> v1beta1/Deployment
NAME     READY  UP-TO-DATE  AVAILABLE  AGE
mongodb  0/1    1           0          0s

NOTES:
** Please be patient while the chart is being deployed **
MongoDB can be accessed via port 27017 on the following DNS name from within your cluster:
    mongodb.default.svc.cluster.local

To get the root password run:
    export MONGODB_ROOT_PASSWORD=$(kubectl get secret --namespace default mongodb -o jsonpath="{.data.mongodb-root-password}" | base64 --decode
)

To connect to your database run the following command:
    kubectl run --namespace default mongodb-client --rm --tty -i --restart='Never' --image bitnami/mongodb --command -- mongo admin --host mongodb --authenticationDatabase admin -u root -p $MONGODB_ROOT_PASSWORD

To connect to your database from outside the cluster execute the following commands:
    kubectl port-forward --namespace default svc/mongodb 27017:27017 &
    mongo --host 127.0.0.1 --authenticationDatabase admin -p $MONGODB_ROOT_PASSWORD