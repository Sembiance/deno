import {xu} from "xu";
import {printUtil} from "xutil";

// serveOptions: {hostname, port, xlog}
export function serve(serveOptions, handler)
{
	const ac = new AbortController();
	const r = {};
	r.stop = () =>
	{
		if(serveOptions.xlog)
			serveOptions.xlog.info`Stopping web server...`;
		ac.abort();
	};
	const onListen = ({hostname, port}) =>
	{
		if(serveOptions.xlog)
			serveOptions.xlog.info`Listening on ${hostname}:${port}`;
	};
	const onError = err =>
	{
		if(serveOptions.xlog)
			serveOptions.xlog.error`Error: ${err}`;
		else
			console.error(err);

		return new Response(`Error: ${err?.toString()}`, {status : 500});
	};
	r.server = Deno.serve({onListen, onError, signal : ac.signal, ...serveOptions}, handler);
	return r;
}

export async function route(routesRaw, args, devMode)
{
	const routes = routesRaw instanceof Map ? routesRaw : new Map(Object.entries(routesRaw));

	const routesEntries = (await Array.from(routes.entries()).parallelMap(async ([prefix, handlerRaw]) => ([prefix, {originalHandler : handlerRaw, handler : (typeof handlerRaw==="string" ? (await import(handlerRaw)).default : handlerRaw)}]))).sortMulti([([prefix]) => prefix], [true]);
	return async request =>
	{
		const u = new URL(request.url);
		let [prefix, {originalHandler, handler}={}] = routesEntries.find(([v]) => (v instanceof RegExp ? v.test(u.pathname) : u.pathname===v)) || [];	// eslint-disable-line prefer-const
		if(!handler)
			return new Response("404 not found", {status : 404});

		if(devMode && typeof originalHandler==="string")
			handler = (await import(`${originalHandler}#${xu.randStr()}`)).default;
		
		try
		{
			const response = await handler(request, args);
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
