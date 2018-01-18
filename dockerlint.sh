#!/bin/bash
docker rm -f $(docker ps -a -q)
wait 3
docker rmi $(docker images -q)
wait 3