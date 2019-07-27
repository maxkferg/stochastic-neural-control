# NOTES

NAME:   kubernetes-dashboard
LAST DEPLOYED: Sat Jul 27 15:19:21 2019
NAMESPACE: default
STATUS: DEPLOYED
RESOURCES:
==> v1/Deployment
NAME                  READY  UP-TO-DATE  AVAILABLE  AGE
kubernetes-dashboard  0/1    1           0          1s
==> v1/Pod(related)
NAME                                   READY  STATUS             RESTARTS  AGE
kubernetes-dashboard-7bd9775bc5-ksfmz  0/1    ContainerCreating  0         0s
==> v1/Secret
NAME                  TYPE    DATA  AGE
kubernetes-dashboard  Opaque  0     1s
==> v1/Service
NAME                  TYPE       CLUSTER-IP    EXTERNAL-IP  PORT(S)  AGE
kubernetes-dashboard  ClusterIP  10.44.14.162  <none>       443/TCP  1s
==> v1/ServiceAccount
NAME                  SECRETS  AGE
kubernetes-dashboard  1        1s
==> v1beta1/Ingress
NAME                  HOSTS                       ADDRESS  PORTS  AGE
kubernetes-dashboard  dashboard.digitalpoints.io  80       1s
==> v1beta1/Role
NAME                  AGE
kubernetes-dashboard  1s
==> v1beta1/RoleBinding
NAME                  AGE
kubernetes-dashboard  1s
NOTES:
*********************************************************************************
*** PLEASE BE PATIENT: kubernetes-dashboard may take a few minutes to install ***
*********************************************************************************
From outside the cluster, the server URL(s) are:
     http://dashboard.digitalpoints.io