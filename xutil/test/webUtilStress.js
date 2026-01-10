import {xu} from "xu";
import {webUtil} from "xutil";
import {XLog} from "xlog";

const PORT_NUM = 37285;
const NOLOG = new XLog("none");
let webServer = null;
webServer = webUtil.serve({host : "127.0.0.1", port : PORT_NUM}, await webUtil.route({"/test" : () => Response.json({something : "Hello, World!", now : new Date()}), "/stop" : () => webServer.stop()}), {xlog : NOLOG});
console.log("Listening...");
