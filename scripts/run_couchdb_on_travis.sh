#!/usr/bin/env bash

if [ ! -z $TRAVIS ]; then
	# Install CouchDB Master
	echo "Starting CouchDB 3 Docker"
	docker run --ulimit nofile=2048:2048 -d -p 5984:5984 \
	    --env COUCHDB_USER=admin --env COUCHDB_PASSWORD=admin \
	    couchdb --with-haproxy -n 1

	# wait for couchdb to start
	while [ '200' != $(curl -s -o /dev/null -w %{http_code} http://admin:admin@127.0.0.1:5984/_all_dbs) ]; do
	  echo waiting for couch to load... ;
	  sleep 1;
	done
fi