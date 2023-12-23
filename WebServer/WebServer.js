/* eslint-disable unicorn/catch-error-name */
import {xu} from "xu";
import {printUtil} from "xutil";
import {XLog} from "xlog";
import {delay} from "std";

export class WebServer
{
	routes = {};
	prefixRoutes = {};

	constructor(host, port, {devMode, xlog=new XLog()}={})
	{
		this.host = host;
		this.port = port;
		this.xlog = xlog;
		this.devMode = devMode;
		this.stopping = false;
	}

	async start()
	{
		this.xlog.info`${this.host}:${this.port} starting...`;
		this.server = await Deno.listen({hostname : this.host, port : this.port});

		this.handleConnections();
	}

	async handleConnections()
	{
		const httpConns = new Set();
		while(true)
		{
			try
			{
				const httpConn = Deno.serveHttp(await this.server.accept());
				httpConns.add(httpConn);
				(async () =>	// eslint-disable-line no-floating-promise/no-floating-promise
				{
					while(!this.stopping)
					{
						try
						{
							const requestEvent = await httpConn.nextRequest();
							if(!requestEvent)
							{
								httpConn.close();	// just in case
								httpConns.delete(httpConn);
								break;
							}

							this.handleRequest(requestEvent).catch(err => this.xlog.warn`${this.host}:${this.port} exception handling connection ${err}`);
						}
						catch
						{
							httpConn.close();	// just in case
							httpConns.delete(httpConn);
							break;
						}
					}
				})();
			}
			catch(err)
			{
				if(!this.stopping)
					this.xlog.warn`Listener closed with ${httpConns.size.toLocaleString()} open HTTP connections with error: ${err}`;
					
				for(const v of httpConns)
					v.close();
				
				if(this.stopping)
					break;
				
				// If we are not stopping, then server close unexpectedly, let's try and re-listen
				this.xlog.error`Unexpected close of listener. Delaying and attempting to start up again`;
				await delay(xu.SECOND*5);
				this.handleConnections();
			}
		}
	}

	respondWithErrorHandler(err)
	{
		this.xlog.warn`.respondWith had an error which we caught ${err}`;
	}

	async handleRequest(httpRequest)
	{
		const u = new URL(httpRequest.request.url);
		const l = `${httpRequest.request.method} ${u.pathname}`;
		const handlers = this.routes[u.pathname] || Object.entries(this.prefixRoutes).find(([prefix]) => u.pathname.startsWith(prefix))?.[1];
		if(!handlers)
		{
			this.xlog.warn`${this.host}:${this.port} unregistered request ${l}`;
			return await httpRequest.respondWith(new Response("404 not found", {status : 404})).catch(err => this.respondWithErrorHandler(err));
		}

		const route = handlers[httpRequest.request.method];
		if(!route)
		{
			this.xlog.warn`${this.host}:${this.port} invalid method for request ${l} expected ${Object.keys(handlers).join(", ")}`;
			return await httpRequest.respondWith(new Response("405 method not allowed", {status : 405})).catch(err => this.respondWithErrorHandler(err));
		}
		
		if(!route.logCheck || route.logCheck(httpRequest.request))
			this.xlog.info`${this.host}:${this.port} request ${l}`;
		try
		{
			let handler = route.handler;
			if(typeof route.handler==="string")
			{
				if(this.devMode)
				{
					handler = (await import(`${route.handler}${this.devMode ? `#${xu.randStr()}` :""}`)).default;
				}
				else
				{
					handler = (await import(route.handler)).default;
					route.handler = handler;
				}
			}
			
			await handler(httpRequest.request, r => httpRequest.respondWith(r).catch(err => this.respondWithErrorHandler(err)), ...(route.args || [])).then(response =>
			{
				// if we are a detached route, then the handler will take care of calling the respondWith second arg on it's own
				if(route.detached)
					return;

				if(!response || !(response instanceof Response))
				{
					this.xlog.warn`${this.host}:${this.port} request handler ${l} returned an invalid response`;
					return httpRequest.respondWith(new Response("no response found", {status : 500})).catch(err => this.respondWithErrorHandler(err));
				}
				
				return httpRequest.respondWith(response);
			}).catch(err =>
			{
				this.xlog.error`${this.host}:${this.port} request handler ${l} threw error ${err}`;
				return httpRequest.respondWith(new Response(`error<br>${printUtil.inspect(err)}`, {status : 500})).catch(err2 => this.respondWithErrorHandler(err2));
			});
		}
		catch(err)
		{
			this.xlog.error`${this.host}:${this.port} request handler ${l} threw error ${err}`;
			return httpRequest.respondWith(new Response(`error<br>${printUtil.inspect(err)}`, {status : 500})).catch(err2 => this.respondWithErrorHandler(err2));
		}
	}

	stop()
	{
		this.xlog.info`${this.host}:${this.port} stopping...`;

		this.stopping = true;
		this.server.close();
		delete this.server;
	}

	add(pathname, handler, {method="GET", detached, logCheck, prefix, args}={})
	{
		const ro = prefix ? this.prefixRoutes : this.routes;
		if(!Object.hasOwn(ro, pathname))
			ro[pathname] = {};

		this.xlog.info`Route ${method} ${pathname} added${prefix ? " (PREFIX ROUTE)" : ""}`;
		ro[pathname][method] = {handler, detached, logCheck, args};
	}

	remove(route)
	{
		delete this.routes[route];
	}
}

