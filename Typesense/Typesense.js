import {xu} from "xu";

export class Typesense
{
	constructor(host, port, apiKey)
	{
		this.host = host;
		this.port = port;
		this.apiKey = apiKey;

		for(const subType of ["collections", "documents", "keys"])
			Object.entries(this[subType]).forEach(([k, v]) => { this[subType][k] = v.bind(this); });
	}

	get serverURL()
	{
		return `http://${this.host}:${this.port}`;
	}

	headers(json, extraHeaders={})
	{
		const h = {"X-TYPESENSE-API-KEY" : this.apiKey, ...extraHeaders};
		if(json)
			h["Content-Type"] = "application/json";
		return h;
	}

	collections = {
		async create(name, fields, o={}) { return await (await fetch(`${this.serverURL}/collections`, {method : "POST", headers : this.headers(true), body : JSON.stringify({name, fields, ...o})})).json(); },
		async drop(name) { return await (await fetch(`${this.serverURL}/collections/${name}`, {method : "DELETE", headers : this.headers()})).json(); },
		async list() { return await (await fetch(`${this.serverURL}/collections`, {method : "GET", headers : this.headers()})).json(); },
		async retrieve(name) { return await (await fetch(`${this.serverURL}/collections/${name}`, {method : "GET", headers : this.headers()})).json(); }
	};

	documents = {
		async index(collectionName, doc) { return await (await fetch(`${this.serverURL}/collections/${collectionName}/documents`, {method : "POST", headers : this.headers(true), body : JSON.stringify(doc)})).json(); },
		async drop(collectionName, docid) { return await (await fetch(`${this.serverURL}/collections/${collectionName}/documents/${docid}`, {method : "DELETE", headers : this.headers()})).json(); },
		async dropByFilter(collectionName, dropFilter) { return await (await fetch(`${this.serverURL}/collections/${collectionName}/documents?batch_size=1000&filter_by=${dropFilter.encodeURLPath()}`, {method : "DELETE", headers : this.headers()})).json(); },
		async retrieve(collectionName, docid) { return await (await fetch(`${this.serverURL}/collections/${collectionName}/documents/${docid}`, {method : "GET", headers : this.headers()})).json(); },
		async search(collectionName, o)
		{
			const query = Object.entries(o).map(([k, v]) => `${k}=${v.toString().encodeURLPath()}`).join("&");
			return await (await fetch(`${this.serverURL}/collections/${collectionName}/documents/search?${query}`, {method : "GET", headers : this.headers()})).json();
		}
	};

	async health() { return await (await fetch(`${this.serverURL}/health`, {method : "GET", headers : this.headers()})).json(); }

	keys = {
		async create(actions, collections, description, o={}) { return await (await fetch(`${this.serverURL}/keys`, {method : "POST", headers : this.headers(true), body : JSON.stringify({actions, collections, description, ...o})})).json(); },
		async drop(keyid) { return await (await fetch(`${this.serverURL}/keys/${keyid}`, {method : "DELETE", headers : this.headers()})).json(); },
		async list() { return await (await fetch(`${this.serverURL}/keys`, {method : "GET", headers : this.headers()})).json(); },
		async retrieve(keyid) { return await (await fetch(`${this.serverURL}/keys/${keyid}`, {method : "GET", headers : this.headers()})).json(); }
	};

	async stats() { return await (await fetch(`${this.serverURL}/stats.json`, {method : "GET", headers : this.headers()})).json(); }
}
