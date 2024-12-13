#!/bin/bash

consume_memory() {
    local arr=()
    while :; do
        arr+=($(seq 1 25000))
		ps -o rss= -p $$
    done
}

consume_memory
