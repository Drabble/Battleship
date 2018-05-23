import docker

APP_ADDRESS = 'nginx'
APP_PORT = 80
APP_PATH = '/status'

TROJAN_PORT = 3666

CONTAINER_NAME = 'battleship-app'
NETWORK_NAME = 'battleship_back'

client = docker.from_env()
container = client.containers.get(CONTAINER_NAME)
network = client.networks.get(NETWORK_NAME)
