NOTES:
### Connecting to Kafka from inside Kubernetes
You can connect to Kafka by running a simple pod in the K8s cluster like this with a configuration like this:
  apiVersion: v1
  kind: Pod
  metadata:
    name: testclient
    namespace: default
  spec:
    containers:
    - name: kafka
      image: confluentinc/cp-kafka:5.0.1
      command:
        - sh
        - -c
        - "exec tail -f /dev/null"
Once you have the testclient pod above running, you can list all kafka
topics with:
  kubectl -n default exec testclient -- kafka-topics --zookeeper dbm-kafka-zookeeper:2181 --list
To create a new topic:
  kubectl -n default exec testclient -- kafka-topics --zookeeper dbm-kafka-zookeeper:2181 --topic test1 --create --partitions 1 --replication-factor 1
To listen for messages on a topic:
  kubectl -n default exec -ti testclient -- kafka-console-consumer --bootstrap-server dbm-kafka:9092 --topic test1 --from-beginning
To stop the listener session above press: Ctrl+C
To start an interactive message producer session:
  kubectl -n default exec -ti testclient -- kafka-console-producer --broker-list dbm-kafka-headless:9092 --topic test1
To create a message in the above session, simply type the message and press "enter"
To end the producer session try: Ctrl+C