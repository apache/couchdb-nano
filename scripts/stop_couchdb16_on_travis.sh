#!/usr/bin/env bash

if [ ! -z $TRAVIS ]; then
  echo "Stopping CouchDB 1.6 Docker"
  docker stop $(docker ps -a -q)
  docker rm $(docker ps -a -q)
fi