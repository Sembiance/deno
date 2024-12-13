#!/bin/bash

ulimit -v "$1"
shift
exec "$@"
