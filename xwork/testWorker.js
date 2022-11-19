import {xu} from "xu";
import {delay} from "std";
import {xwork} from "xwork";

const v = await xwork.arg();
await delay(300);
await xwork.done(v*5);
