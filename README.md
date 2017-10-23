# Ethereum Docker

* Deploy private Ethereum testnet clusters using Docker.
* Monitor Ethereum nodes via netstats interface.
* Easily manage running containers using Portainer.

## Deploy Ethereum Cluster

Use the following command in a terminal:

```$ docker-compose up -d```

By default this will create:

* 1 Ethereum Bootstrapped container
* 1 Ethereum container (which connects to the bootstrapped container on launch)
* 1 Netstats container (with a Web UI to view activity in the cluster)

To access the Netstats Web UI:

```open http://localhost:3000```

### Scaling the number of nodes/containers in the cluster

```docker-compose scale eth=#```

This will scale the testnet to # nodes. These nodes will connect to the P2P network (via the bootstrap node)
by default.

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
