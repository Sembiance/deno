#!/sbin/openrc-run

depend() {
    need net
    after netmount
}

start() {
    ebegin "Starting xvfbNumServer"
    start-stop-daemon --start --background --chdir /mnt/compendium/DevLab/deno --make-pidfile --pidfile /var/run/xvfbNumServer.pid \
    --exec /usr/bin/deno -- run --v8-flags=--max-old-space-size=32768,--expose-gc --import-map /mnt/compendium/DevLab/deno/importMap.json --unstable --allow-net --allow-read xvfbNumServer.js
    eend $?
}

stop() {
    ebegin "Stopping xvfbNumServer"
    start-stop-daemon --stop --quiet --pidfile /var/run/xvfbNumServer.pid
    eend $?
}
