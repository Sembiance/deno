import {xu} from "xu";
import {delay} from "std";
import {xwork} from "xwork";

await xwork.openConnection();

const arg = await xwork.args();
xwork.send(arg);
await delay(250);
xwork.recv(async msg => await xwork.send({nums : msg.nums.map(v => v/7), str : msg.str.reverse(), bool : !msg.bool}));
await delay(250);
xwork.send("Hello, from Worker!");
await delay(500);
await xwork.done({nums : [3.14, 1.235], arg});
await xwork.closeConnection();
