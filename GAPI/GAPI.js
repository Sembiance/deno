import {xu} from "xu";
import {RateLimitedQueue} from "RateLimitedQueue";
import {base64Decode} from "std";
import {jwtCreate, getNumericDate} from "denoLandX";
import {XLog} from "xlog";

export class GAPI
{
	authExpiresAt = 0;

	constructor({serviceKeyFilePath, scopes=[], ratePeriod=xu.MINUTE, ratePer=1800, xlog=new XLog("error")}={})
	{
		if(!serviceKeyFilePath)
			throw new Error("serviceKeyFilePath is required");
		if(!scopes?.length)
			throw new Error("At least 1 scope is required");

		this.xlog = xlog;
		this.serviceKeyFilePath = serviceKeyFilePath;
		this.scopes = scopes;
		this.rlq = new RateLimitedQueue(ratePer, ratePeriod);
		this.rlq.start();
	}

	// https://developers.google.com/identity/protocols/oauth2/service-account#authorizingrequests
	async auth()
	{
		// make sure I have a proper key first
		if(!this.key)
		{
			this.serviceKeyData = xu.parseJSON(await Deno.readTextFile(this.serviceKeyFilePath));

			const keyDecoded = base64Decode(this.serviceKeyData.private_key.replaceAll("\n", "").slice("-----BEGIN PRIVATE KEY-----".length, -"-----END PRIVATE KEY-----".length));
			this.key = await crypto.subtle.importKey("pkcs8", keyDecoded, {name : "RSASSA-PKCS1-v1_5", hash : "SHA-256"}, true, ["sign"]);
			this.xlog.debug`Crypto key imported`;
		}

		if(performance.now()>=this.authExpiresAt)
		{
			this.xlog.debug`Re-authorizing...`;
			
			const jwt = await jwtCreate( {alg : "RS256", typ : "JWT"}, {
				iss   : this.serviceKeyData.client_email,
				scope : this.scopes.join(" "),
				aud   : this.serviceKeyData.token_uri,
				exp   : getNumericDate(60 * 60),
				iat   : getNumericDate(0)
			}, this.key);

			const oAuthResponse = await fetch(this.serviceKeyData.token_uri, {method : "POST", headers : {"Content-Type" : "application/x-www-form-urlencoded"}, body : `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`});
			this.xlog.debug`OAuth response ${oAuthResponse.status} ${oAuthResponse.statusText}`;
			if(oAuthResponse.status!==200)
				throw new Error(`Failed to get OAuth Token ${oAuthResponse.status} ${oAuthResponse.statusText} ${await oAuthResponse.text()}`);
			
			const oAuthData = await oAuthResponse.json();
			
			this.token = oAuthData.access_token;
			this.authExpiresAt = (performance.now()+(oAuthData.expires_in*xu.SECOND))-xu.MINUTE;
		}

		return {Authorization : `Bearer ${this.token}`};
	}

	// calls a google api that takes JSON and returns JSON
	async callJSONAPI(apiURL, reqData)
	{
		await this.rlq.wait();
		const apiResponse = await fetch(apiURL, {method : "POST", headers : {"Content-Type" : "application/json; charset=utf-8", ...await this.auth()}, body : JSON.stringify(reqData)});
		if(apiResponse.status!==200)
			throw new Error(`Error [${apiResponse.status} ${apiResponse.statusText}] ${await apiResponse.text()} calling API ${apiURL}`);
		
		return await apiResponse.json();
	}
}
