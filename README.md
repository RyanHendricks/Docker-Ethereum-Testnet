# Docker Ethereum Testnet

* Deploy a private Ethereum testnet cluster with netstats using Docker

**Additional Features**
* Manage running containers using the Portainer GUI.
* Interact with your private blockchain using Etherwallet (account interface) and Ethersapp (contract interface)

## Getting Started

### 1. Deploy Ethereum Testnet

```$ docker-compose up -d```

This will build the images and start the containers for:

* 1 Ethereum Bootstrapped container (acts as a primary node for the other nodes to connect)
* 1 Ethereum "Slave" container (which connects to the bootstrapped container on launch)
* 1 Netstats container (with a Web UI to view activity in the cluster) To access the Netstats Web UI: `open http://localhost:3000`

### Test accounts

There are 3 pre-funded accounts included.
Private keys can be found in ./files/keystore

----
## Managing Cluster

You can manage the containers via the command line or using portainer.

Use the following Docker commands to deploy Portainer:
```docker volume create portainer_data```

to create a volume for persistant storage

```docker run -d -p 9000:9000 -v /var/run/docker.sock:/var/run/docker.sock -v portainer_data:/data portainer/portainer```

Access the Portainer Dashboard via http://localhost:9000

Note: the -v /var/run/docker.sock:/var/run/docker.sock option can be used in Linux environments only.


### Interact with geth via commandline

If you want to start mining or stop mining you need to connect to the node via:
```
docker exec -it ethereumdocker_eth_1 geth attach ipc://root/.ethereum/devchain/geth.ipc
```

### Cleanup Docker (containers and images)
`docker ps -aq | xargs docker rm -f`
`docker images -aq | xargs docker rmi -f`
