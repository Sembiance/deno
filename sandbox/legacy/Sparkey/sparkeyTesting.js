import {xu} from "xu";
import {XLog} from "xlog";

const xlog = new XLog();

const dylib = Deno.dlopen("./sparkeyDeno.so", {
	get : { parameters : ["buffer", "u32", "buffer", "u32"], result : "buffer" },
	put : { parameters : ["buffer", "u32", "buffer", "u32", "buffer", "u32"], result : "u8" }
});

function get(dbFilePathPrefix, k)
{
	const dbFilePathPrefixBuffer = new TextEncoder().encode(dbFilePathPrefix);
	const keyBuffer = new TextEncoder().encode(k);
	const callResult = dylib.symbols.get(dbFilePathPrefixBuffer, dbFilePathPrefixBuffer.length, keyBuffer, keyBuffer.length);
	if(!callResult)
		return;

	const dataView = new Deno.UnsafePointerView(callResult);
	const r = new Uint8Array(dataView.getUint32());
	dataView.copyInto(r, 4);

	return new TextDecoder().decode(r);
}

function put(dbFilePathPrefix, k, v)
{
	const dbFilePathPrefixBuffer = new TextEncoder().encode(dbFilePathPrefix);
	const keyBuffer = new TextEncoder().encode(k);
	const valBuffer = new TextEncoder().encode(v);
	return !!dylib.symbols.put(dbFilePathPrefixBuffer, dbFilePathPrefixBuffer.length, keyBuffer, keyBuffer.length, valBuffer, valBuffer.length);
}

//xlog.info`${put("/tmp/test", "hello", "Hello, World!")}`;
//xlog.info`${put("/tmp/test", "test", "yup, it works!")}`;
//xlog.info`${put("/tmp/test", "3rd", "3 3 3")}`;

xlog.info`${get("/tmp/test", "hello")}`;
xlog.info`${get("/tmp/test", "test")}`;
xlog.info`${get("/tmp/test", "3rd")}`;
