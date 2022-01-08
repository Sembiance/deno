#!/sbin/openrc-run

depend() {
    need net
    use dns netmount
}

start() {
    ebegin "Starting xvfbNumServer"
    /mnt/compendium/DevLab/deno/xvfbNumServer-run.sh
    eend $?
}

stop() {
    ebegin "Stopping xvfbNumServer"
    kill `cat /var/run/xvfbNumServer.pid`
    eend $?
}
