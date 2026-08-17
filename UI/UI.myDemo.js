import {xu} from "xu";
import {delay} from "std";
import {runUtil} from "xutil";
import {XLog} from "xlog";
import {UI} from "UI";

const xlog = new XLog();

const RUN_SAR_FOR = xu.SECOND*5;

const [section] = await UI.create("100", {title : "runUtil test"});
xlog.logger = line => section.log(line);

xlog.info`Hello, World!`;
await delay(xu.SECOND);
xlog.info`Running ${"sar"} which updates every ${1} second for ${RUN_SAR_FOR.msAsHumanReadable()}...`;
await delay(xu.SECOND);

await runUtil.run("sar", ["-u", "1"], {timeout : RUN_SAR_FOR, stdoutPipe : section.out});

const name = await section.prompt("Enter a new title");
//xlog.info`Setting title to ${name}...`;
UI.title = name;
await section.waitForEnter();
xlog.info`Exiting...`;
Deno.exit(0);


