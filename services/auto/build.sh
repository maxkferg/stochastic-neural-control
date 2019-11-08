
docker build -f Dockerfile-gpu -t digitalpoints/trainer:gpu .
docker push digitalpoints/trainer:gpu

docker build -t digitalpoints/trainer:latest .
docker push digitalpoints/trainer:latest
