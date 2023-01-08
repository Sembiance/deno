import {xu} from "xu";
import * as runUtil from "./runUtil.js";

/** Returns info about the given video at videoFilePath including duration, bitrate, width, height, etc */
export async function getInfo(videoFilePath, {timeout=xu.MINUTE}={})
{
	const mplayerArgs = ["-frames", "0", "-identify", "--", videoFilePath];
	if(videoFilePath.endsWith(".m2ts"))
		mplayerArgs.unshift("-demuxer", "lavf");
	const {stdout} = await runUtil.run("mplayer", mplayerArgs, {timeout});
	const info = {};
	stdout.split("\n").forEach(line =>
	{
		if(!line.includes("="))
			return;

		const parts = line.split("=");
		if(parts.length!==2)
			return;

		if(parts[0]==="ID_LENGTH")
			info.duration = (+parts[1])*xu.SECOND;
		if(parts[0]==="ID_VIDEO_BITRATE")
			info.bitrate = +parts[1];
		if(parts[0]==="ID_VIDEO_WIDTH")
			info.width = +parts[1];
		if(parts[0]==="ID_VIDEO_HEIGHT")
			info.height = +parts[1];
		if(parts[0]==="ID_VIDEO_FPS")
			info.fps = +parts[1];
		if(parts[0]==="ID_VIDEO_ASPECT")
			info.aspectRatio = +parts[1];
		if(parts[0]==="ID_VIDEO_FORMAT")
			info.format = parts[1];
		if(parts[0]==="ID_VIDEO_CODEC")
			info.codec = parts[1];
		if(parts[0]==="ID_DEMUXER")
			info.demuxer = parts[1];
	});

	if(info.format)
	{
		const formatLow = info.format.toLowerCase();
		
		if(formatLow==="h264")
			info.mimeType = "video/h264";
		else if(formatLow==="divx" || formatLow==="dx5")
			info.mimeType = "video/divx";
		else if(formatLow.startsWith("wmv"))
			info.mimeType = "video/x-ms-wmv";
		else
			info.mimeType = "video/avi";
	}

	return info;
}
