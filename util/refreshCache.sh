#!/bin/bash

shopt -s expand_aliases
source /mnt/compendium/sys/bash/bash_aliases

if ! whoami | grep -q "root"; then
    echo "Must be ran as root"
    exit
fi

rm -rf /var/cache/deno/
mkdir /var/cache/deno
chmod 777 /var/cache/deno

RUN_AS_USER=""

if id sembiance &>/dev/null; then
    RUN_AS_USER="sembiance"
elif id discmaster &>/dev/null; then
    RUN_AS_USER="discmaster"
fi

if [[ -n "$RUN_AS_USER" ]]; then
    sudo -u "$RUN_AS_USER" bash << 'EOF'
	shopt -s expand_aliases
	source /mnt/compendium/sys/bash/bash_aliases
	cd /mnt/compendium/DevLab/deno/util
	dra primeCache.js
EOF
else
    cd /mnt/compendium/DevLab/deno/util
    dra primeCache.js
fi
