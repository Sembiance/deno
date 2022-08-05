import {xu} from "xu";
import {runUtil} from "xutil";

export async function runAwesomeCode(code)
{
	await runUtil.run("awesome-client", [], {stdinData : code, inheritEnv : true, liveOutput : true});
}

export async function setLayout(layoutName, workspaceNum, screenNum=null)
{
	await runAwesomeCode(`local awful = require("awful");

	local targetScreenNum = ${screenNum===null ? "awful.screen.focused().index" : screenNum};
	for s in screen do
		if s.index == targetScreenNum then
			local t = s.tags[${workspaceNum}]

			for k, v in pairs(t.layouts) do
				if v.name == "${layoutName}" then
					awful.layout.set(v, t)
				end
			end
		end
	end`);
}

export async function switchToWorkspace(workspaceNum, screenNum=null)
{
	await runAwesomeCode(`local awful = require("awful");

	local targetScreenNum = ${screenNum===null ? "awful.screen.focused().index" : screenNum};
	for s in screen do
		if s.index == targetScreenNum then
			s.tags[${workspaceNum}]:view_only();
		end
	end`);
}

export async function runAndGetWindow(cmd, args, options={})
{
	const {p} = await runUtil.run(cmd, args, Object.assign(Object.assign({}, options), {inheritEnv : true, detached : true}));
	let pWID = null;

	await xu.waitUntil(async () =>
	{
		const {stdout : windowsRaw} = await runUtil.run("wmctrl", ["-lp"], {inheritEnv : true});
		for(const window of windowsRaw.trim().split("\n").map(v => v.match(/^(?<wid>\S+)\s+\S+\s+(?<pid>\d+)\s+.+$/)))
		{
			const {wid, pid} = window.groups;
			if(+pid===p.pid)
			{
				pWID = wid;
				return true;
			}
		}
		return false;
	});

	return {p, wid : pWID};
}

export async function cycleClients(screenNum, clockwise=false)
{
	await runAwesomeCode(`local awful = require("awful")

		for s in screen do
			if s.index == ${screenNum===null ? "mouse.screen.index" : screenNum} then
				awful.client.cycle(${clockwise ? "true" : "false"}, s)
			end
		end`);
}

export async function fixTerminalWallpaper(screenNum=null)
{
	await cycleClients(screenNum, true);
	await cycleClients(screenNum, false);
}

export async function runTerminal(cmd)
{
	const r = await runAndGetWindow("urxvt", []);
	await fixTerminalWallpaper();
	if(cmd)
		await runTerminalCommand(r.wid, cmd);
	return r;
}

export async function runTerminalCommand(wid, cmd, {newTab=false}={})
{
	if(newTab)
		await runUtil.run("xdotool", ["key", "--clearmodifiers", "--window", wid, "shift+Down"], {inheritEnv : true});
	
	await runUtil.run("xdotool", ["type", "--clearmodifiers", "--window", wid, cmd], {inheritEnv : true});

	if(newTab)
	{
		await fixTerminalWallpaper();
		await runUtil.run("xdotool", ["key", "--window", wid, "shift+Right"], {inheritEnv : true});
		await runUtil.run("xdotool", ["key", "--window", wid, "shift+Left"], {inheritEnv : true});
	}

	await runUtil.run("xdotool", ["keyup", "Shift_L", "Shift_R", "Control_L", "Control_R", "Meta_L", "Meta_R", "Alt_L", "Alt_R", "Super_L", "Super_R", "Hyper_L", "Hyper_R"], {inheritEnv : true});
}

// naughty.notify({ preset = naughty.config.presets.normal, title = "debug message", text = string.format("targetScreenNum %d  s.index %d", targetScreenNum, s.index) })
