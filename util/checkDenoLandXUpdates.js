import {xu, fg} from "xu";
import {path} from "std";

const dataRaw = await Deno.readTextFile(path.join(xu.dirname(import.meta), "..", "denoLandX.js"));
const matches = dataRaw.match(/https:\/\/deno.land[^"]+/g).map(v => ([v.split("@")[0], v.split("@")[1].substring(0, v.split("@")[1].indexOf("/"))]));
console.log(`Open these in chrome to determine latest version:\n\t${matches.map(([u, v]) => `${fg.cyanDim(u)} ${fg.yellow(v)}`).join("\n\t")}`);
console.log(`\nThen update versions in: ${fg.greenDim("/mnt/compendium/DevLab/deno/denoLandX.js")}`);
