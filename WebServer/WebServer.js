/* eslint-disable unicorn/catch-error-name */
import {xu} from "xu";
import {XLog} from "xlog";

export class WebServer
{
	routes = {};
	prefixRoutes = {};
	connections = [];

	constructor(host, port, {xlog=new XLog()}={})
	{
		this.host = host;
		this.port = port;
		this.xlog = xlog;
	}

	async start()
	{
		this.xlog.info`${this.host}:${this.port} starting...`;
		this.server = await Deno.listen({hostname : this.host, port : this.port});

		(async () =>	// eslint-disable-line sembiance/shorter-arrow-funs, no-floating-promise/no-floating-promise
		{
			for await(const conn of this.server)
				this.handleConn(conn).catch(err => this.xlog.error`${this.host}:${this.port} exception handling connection ${err}`);
		})();
	}

	respondWithErrorHandler(err)
	{
		this.xlog.warn`.respondWith had an error which we caught ${err}`;
	}

	async handleConn(conn)
	{
		const httpConn = Deno.serveHttp(conn);
		this.connections.push(httpConn);
		for await(const httpRequest of httpConn)
		{
			const u = new URL(httpRequest.request.url);
			const l = `${httpRequest.request.method} ${u.pathname}`;
			const handlers = this.routes[u.pathname] || Object.entries(this.prefixRoutes).find(([prefix]) => u.pathname.startsWith(prefix))?.[1];
			if(!handlers)
			{
				this.xlog.warn`${this.host}:${this.port} unregistered request ${l}`;
				await httpRequest.respondWith(new Response("404 not found", {status : 404})).catch(err => this.respondWithErrorHandler(err));
				continue;
			}

			const route = handlers[httpRequest.request.method];
			if(!route)
			{
				this.xlog.warn`${this.host}:${this.port} invalid method for request ${l} expected ${Object.keys(handlers).join(", ")}`;
				await httpRequest.respondWith(new Response("405 method not allowed", {status : 405})).catch(err => this.respondWithErrorHandler(err));
				continue;
			}
			
			if(!route.logCheck || route.logCheck(httpRequest.request))
				this.xlog.info`${this.host}:${this.port} request ${l}`;
			try
			{
				await route.handler(httpRequest.request, r => httpRequest.respondWith(r).catch(err => this.respondWithErrorHandler(err))).then(response =>
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
					return httpRequest.respondWith(new Response(`error<br>${xu.inspect(err)}`, {status : 500})).catch(err2 => this.respondWithErrorHandler(err2));
				});
			}
			catch(err)
			{
				this.xlog.error`${this.host}:${this.port} request handler ${l} threw error ${err}`;
				return httpRequest.respondWith(new Response(`error<br>${xu.inspect(err)}`, {status : 500})).catch(err2 => this.respondWithErrorHandler(err2));
			}
		}
	}

	stop()
	{
		this.xlog.info`${this.host}:${this.port} stopping...`;
		if(this.server)
		{
			this.server.close();
			delete this.server;
		}

		this.xlog.info`${this.host}:${this.port} closing ${this.connections.length} connections...`;
		for(const connection of this.connections)
		{
			try { connection.close(); }
			catch {}
		}
	}

	add(pathname, handler, {method="GET", detached, logCheck, prefix}={})
	{
		const ro = prefix ? this.prefixRoutes : this.routes;
		if(!Object.hasOwn(ro, pathname))
			ro[pathname] = {};

		this.xlog.info`Route ${method} ${pathname} added${prefix ? " (PREFIX ROUTE)" : ""}`;
		ro[pathname][method] = {handler, detached, logCheck};
	}

	remove(route)
	{
		delete this.routes[route];
	}
}
