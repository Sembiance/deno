import {xu} from "xu";
import {base64Encode} from "std";
import {fileUtil, runUtil} from "xutil";
import {XLog} from "xlog";

const xlog = new XLog();

export class B2
{
	static async create(authFilePath)
	{
		const b2 = new B2();

		b2.authFilePath = authFilePath;
		
		const authData = Object.fromEntries((await fileUtil.readTextFile(authFilePath)).split("\n").filter(line => line.includes(" = ")).map(line => line.split(" = ")));
		b2.b2Auth = await xu.fetch("https://api.backblazeb2.com/b2api/v2/b2_authorize_account", { asJSON : true, headers : { Authorization : `Basic ${base64Encode(`${authData.account}:${authData.key}`)}` } });

		return b2;
	}

	async fileSize(bucketName, bucketPath)
	{
		const response = (await fetch(`${this.b2Auth.downloadUrl}/file/${bucketName}/${bucketPath}`, { method : "HEAD", headers : { Authorization : this.b2Auth.authorizationToken } }));
		return response?.status===200 ? +response.headers.get("Content-Length") : -1;
	}

	async uploadFile(filePath, bucketName, bucketPath)
	{
		await runUtil.run("rclone", ["--config", this.authFilePath, "--links", "copyto", filePath, `b2:${bucketName}/${bucketPath}`]);
	}

	async deleteFile(bucketName, bucketPath)
	{
		const bucketInfo = (await xu.fetch(`${this.b2Auth.apiUrl}/b2api/v2/b2_list_buckets`, { asJSON : true, headers : { Authorization : this.b2Auth.authorizationToken }, json : { accountId : this.b2Auth.accountId, bucketName} })).buckets[0];
		const fileInfo = (await xu.fetch(`${this.b2Auth.apiUrl}/b2api/v2/b2_list_file_names`, { asJSON : true, headers : { Authorization : this.b2Auth.authorizationToken }, json : { bucketId : bucketInfo.bucketId, prefix : bucketPath, maxFileCount : 1 } })).files[0];
		if(!fileInfo)
			throw new Error(`File not found: ${bucketPath}`);

		return await xu.fetch(`${this.b2Auth.apiUrl}/b2api/v2/b2_delete_file_version`, { asJSON : true, headers : { Authorization : this.b2Auth.authorizationToken }, json : { fileName : fileInfo.fileName, fileId : fileInfo.fileId } });
	}
}
