#!/usr/bin/env bash

if [ ! -z $TRAVIS ]; then
	# Install CouchDB Master
	echo "Starting CouchDB 2.0 Docker"
	docker run --ulimit nofile=2048:2048 -d -p 5984:5984 couchdb --with-haproxy \
	    --with-admin-party-please -n 1

	# wait for couchdb to start
	while [ '200' != $(curl -s -o /dev/null -w %{http_code} http://127.0.0.1:5984) ]; do
	  echo waiting for couch to load... ;
	  sleep 1;
	done
fi