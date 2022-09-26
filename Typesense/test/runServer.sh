#!/bin/bash

SERVER_DIR=/mnt/compendium/DevLab/deno/Typesense/test/server

sudo rm -rf "$SERVER_DIR"
mkdir -p "$SERVER_DIR"
cd "$SERVER_DIR" || exit

docker run --name "typesense-test" --rm -p 38281:38281 -v "$SERVER_DIR":/data typesense/typesense:0.22.1 --data-dir=/data --api-port=38281 --api-key=denoTypesenseServerAdminKey

sleep 5

sudo rm -rf "$SERVER_DIR"
