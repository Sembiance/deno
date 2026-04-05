import {xu} from "xu";
import {gzipSync, gunzipSync} from "node:zlib";

let textEncoder;
export function gzip(data)
{
	if(typeof data==="string")
	{
		textEncoder ||= new TextEncoder();
		return gzipSync(textEncoder.encode(data));
	}

	return gzipSync(data);
}

export function gunzip(data)
{
	return gunzipSync(data);
}
