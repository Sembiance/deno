import {xu} from "xu";
import {printUtil, fileUtil} from "xutil";
import {path} from "std";
import {XLog} from "xlog";

// serveOptions: {hostname, port, xlog}
export function serve(serveOptions, handler, {xlog=new XLog("warn")}={})
{
	const ac = new AbortController();
	const r = {};
	r.stop = () =>
	{
		xlog.info`Stopping web server...`;
		ac.abort();
	};
	const onListen = ({hostname, port}) => xlog.info`Listening on ${hostname}:${port}`;
	const onError = err =>
	{
		xlog.error`Error: ${err}`;
		return new Response(`Error: ${err?.toString()}`, {status : 500});
	};
	r.server = Deno.serve({onListen, onError, signal : ac.signal, ...serveOptions}, handler);
	return r;
}

// Creates a single request handler sutable to pass to Deno.serve based on the provided routes
// routesRaw can be Map map or Object
//   Each key is either a string that must match the URL prefix, or a regex to check against the URL
//   Each value is either a string (path to a file.js that will handle the request with a default function) or a function that will handle the request directly
// devMode can be set to true and then any changes to file.js handlers will be monitored and it will automatically reload the handler
//   NOTE: devMode only works if all the strings in routesRaw that point to file paths share a common directory
// getStopper is an optional function that will be called with a function that you can call to stop the monitorer when you choose to stop the server
export async function route(routesRaw, args, {devMode, getStopper}={})
{
	const routes = routesRaw instanceof Map ? routesRaw : new Map(Object.entries(routesRaw));
	const routesEntries = (await Array.from(routes.entries()).parallelMap(async ([prefix, handlerRaw]) => ([prefix, {originalHandler : handlerRaw, handler : (typeof handlerRaw==="string" ? (await import(handlerRaw)).default : handlerRaw)}]))).sortMulti([([prefix]) => prefix], [true]);

	if(devMode)
	{
		const routePaths = Array.from(routes.values()).filter(v => typeof v==="string").map(v => path.dirname(v)).unique();
		let commonDirPath = routePaths[0];
		while(!routePaths.slice(1).every(v => v.startsWith(commonDirPath)))	// eslint-disable-line no-loop-func
			commonDirPath = path.dirname(commonDirPath);
		
		if(commonDirPath==="/")
			throw new Error("Could not find a common directory for all the route handlers");

		const monitorer = await fileUtil.monitor(commonDirPath, async ({type, filePath}) =>
		{
			if(type!=="create" && type!=="modify")
				return;

			const routeEntry = routesEntries.find(([, {originalHandler}]) => originalHandler===filePath)?.[1];
			if(routeEntry)
			{
				try
				{
					routeEntry.handler = (await import(`${routeEntry.originalHandler}#${xu.randStr()}`)).default;
				}
				catch(err)
				{
					if(args?.xlog)
						args.xlog.error`Error loading handler: ${err}`;
				}
			}
		});

		if(getStopper)
			getStopper(async () => await monitorer.stop());
	}

	return async (request, _info, extraArgs={}) =>
	{
		const u = new URL(request.url);
		const [prefix, {handler}={}] = routesEntries.find(([v]) => (v instanceof RegExp ? v.test(u.pathname) : u.pathname===v)) || [];
		if(!handler)
			return new Response("404 not found", {status : 404});
		
		try
		{
			const response = await handler(request, {...args, ...extraArgs});
			if(!response)
			{
				if(args?.xlog)
					args.xlog.warn`request handler ${prefix} did not return a response`;
				return new Response("no response found", {status : 500});
			}
			
			if(!(response instanceof Response))
			{
				if(args?.xlog)
					args.xlog.warn`request handler ${prefix} returned an invalid response: ${response}`;
				return new Response("invalid response found", {status : 500});
			}
			return response;
		}
		catch(err)
		{
			if(args?.xlog)
				args.xlog.error`request handler ${prefix} threw an error: ${err}`;
			return new Response(`error<br>${printUtil.inspect(err)}`, {status : 500});
		}
	};
}
