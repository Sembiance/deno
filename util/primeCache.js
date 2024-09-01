import * as std from "std";
import * as xu from "xu";
import * as xutil from "xutil";

for(const key of Object.keys(xu.xu.parseJSON(await xutil.fileUtil.readTextFile(std.path.join(import.meta.dirname, "..", "importMap.json")), {}).imports))
	await import(key);

