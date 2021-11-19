import {xu} from "xu";

export class WebServer
{
	routes = {};
	connections = [];

	static create(host, port)
	{
		const webServer = new WebServer();
		webServer.host = host;
		webServer.port = port;

		return webServer;
	}

	async start()
	{
		xu.log1`${this.host}:${this.port} starting...`;
		this.server = await Deno.listen({hostname : this.host, port : this.port});

		(async () =>	// eslint-disable-line sembiance/shorter-arrow-funs
		{
			for await(const conn of this.server)
				this.handleConn(conn);
		})();
	}

	respondWithErrorHandler(err)
	{
		xu.log`.respondWith errored out ${err}`;
	}

	async handleConn(conn)
	{
		const httpConn = Deno.serveHttp(conn);
		this.connections.push(httpConn);
		for await(const httpRequest of httpConn)
		{
			const u = new URL(httpRequest.request.url);
			const l = `${httpRequest.request.method} ${u.pathname}`;
			const handlers = this.routes[u.pathname];
			if(!handlers)
			{
				xu.log3`${this.host}:${this.port} unregistered request ${l}`;
				await httpRequest.respondWith(new Response("404 not found", {status : 404})).catch(this.respondWithErrorHandler);
				continue;
			}

			const route = handlers[httpRequest.request.method];
			if(!route)
			{
				xu.log3`${this.host}:${this.port} invalid method for request ${l} expected ${Object.keys(handlers).join(", ")}`;
				await httpRequest.respondWith(new Response("405 method not allowed", {status : 405})).catch(this.respondWithErrorHandler);
				continue;
			}
			
			xu.log3`${this.host}:${this.port} request ${l}`;
			try
			{
				route.handler(httpRequest.request, r => httpRequest.respondWith(r).catch(this.respondWithErrorHandler)).then(response =>
				{
					// if we are a detached route, then the handler will take care of calling the respondWith second arg on it's own
					if(route.detached)
						return;

					if(!response || !(response instanceof Response))
					{
						xu.log1`${this.host}:${this.port} request handler ${l} returned an invalid response`;
						return httpRequest.respondWith(new Response("no response found", {status : 500})).catch(this.respondWithErrorHandler);
					}
					
					return httpRequest.respondWith(response);
				}).catch(err =>
				{
					xu.log1`${this.host}:${this.port} request handler ${l} threw error ${err}`;
					return httpRequest.respondWith(new Response(`error<br>${xu.inspect(err)}`, {status : 500})).catch(this.respondWithErrorHandler);
				});
			}
			catch(err)
			{
				xu.log1`${this.host}:${this.port} request handler ${l} threw error ${err}`;
				return httpRequest.respondWith(new Response(`error<br>${xu.inspect(err)}`, {status : 500})).catch(this.respondWithErrorHandler);
			}
		}
	}

	stop()
	{
		xu.log1`${this.host}:${this.port} stopping...`;
		if(this.server)
		{
			this.server.close();
			delete this.server;
		}

		xu.log1`${this.host}:${this.port} closing ${this.connections.length} connections...`;
		for(const connection of this.connections)
		{
			try { connection.close(); }
			catch {}
		}
	}

	add(pathname, handler, {method="GET", detached}={})
	{
		if(!Object.hasOwn(this.routes, pathname))
			this.routes[pathname] = {};

		this.routes[pathname][method] = {handler, detached};
	}

	remove(route)
	{
		delete this.routes[route];
	}
}
