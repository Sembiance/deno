#!/bin/bash

daemonize -a -c /mnt/compendium/DevLab/deno -p /var/run/xvfbNumServer.pid /usr/bin/deno run --v8-flags=--max-old-space-size=32768,--expose-gc --import-map /mnt/compendium/DevLab/deno/importMap.json --unstable --allow-all xvfbNumServer.js
