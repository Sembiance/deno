import {xu} from "xu";
import {delay} from "std";
import {WebServer} from "./WebServer.js";
import {XLog} from "xlog";

const PORT_NUM = 37285;
const NOLOG = new XLog("none");

const webServer = new WebServer("127.0.0.1", PORT_NUM, {xlog : NOLOG});
await webServer.start();
webServer.add("/test", async () => new Response("Hello, World!"));	 // eslint-disable-line require-await
webServer.add("/testDelay", async () =>
{
	await delay(Math.randomInt(0, 1500));
	return new Response("Hello, World!");
});

console.log(`Search server running on port ${PORT_NUM}`);
