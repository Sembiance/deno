import {xu} from "xu";
import {XLog} from "xlog";
import {WebServer} from "WebServer";
import {fileUtil} from "xutil";

const xlog = new XLog("none");

const XVFB_NUM_SERVER_PORT = 21787;
const XVFB_NUM_MIN = 10;
const XVFB_NUM_MAX = 59999;	// in theory since we call runUtil with -nolisten tcp, we just have unix sockets, so no real upper limit on number (billions) but 59,999 - 10 should be plenty
let XVFB_NUM_COUNTER = XVFB_NUM_MIN;

const webServer = new WebServer("127.0.0.1", XVFB_NUM_SERVER_PORT, {xlog});
webServer.add("/getNum", async () =>
{
	let xvfbNum = null;
	do
	{
		xvfbNum = XVFB_NUM_COUNTER++;
		if(XVFB_NUM_COUNTER>XVFB_NUM_MAX)
			XVFB_NUM_COUNTER = XVFB_NUM_MIN;

		// skip this number if there is an existing X socket for this number
		if(await fileUtil.exists(`/tmp/.X11-unix/X${xvfbNum}`))
			continue;
		
		break;
	} while(true);

	return new Response(xvfbNum.toString());
});

webServer.start();
