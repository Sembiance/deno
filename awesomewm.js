import {xu} from "xu";
import {runUtil} from "xutil";
import {delay} from "std";

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

// Current AVL setup: 2===left 1===middle 3===right    crystalsummit w/ 2 monitors: 2===left  1===middle
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

export async function runTerminal(cmd, options)
{
	const r = await runAndGetWindow("urxvt", []);
	if(cmd || options?.tabName)
	{
		await delay(150);
		await runTerminalCommand(r.wid, cmd, options);
	}
	return r;
}

export async function runTerminalCommand(wid, cmd, {newTab=false, cmdDelay=0, tabName}={})
{
	if(newTab)
		await runUtil.run("xdotool", ["key", "--clearmodifiers", "--window", wid, "shift+Down"], {inheritEnv : true});

	if(cmd?.length)
		await runUtil.run("xdotool", ["type", "--clearmodifiers", "--window", wid, cmd], {inheritEnv : true});

	if(newTab)
	{
		await delay(40);
		await runUtil.run("xdotool", ["key", "--window", wid, "shift+Right"], {inheritEnv : true});
		await delay(40);
		await runUtil.run("xdotool", ["key", "--window", wid, "shift+Left"], {inheritEnv : true});
		await delay(40);
	}

	if(tabName)
		await setTerminalTabName(wid, tabName);

	if(cmdDelay)
		await delay(cmdDelay);

	await runUtil.run("xdotool", ["keyup", "Shift_L", "Shift_R", "Control_L", "Control_R", "Meta_L", "Meta_R", "Alt_L", "Alt_R", "Super_L", "Super_R", "Hyper_L", "Hyper_R"], {inheritEnv : true});
}

export async function setTerminalTabName(wid, tabName)
{
	await runUtil.run("xdotool", ["key", "--clearmodifiers", "--window", wid, "shift+Up"], {inheritEnv : true});
	await delay(125);
	await runUtil.run("xdotool", ["type", "--clearmodifiers", "--window", wid, `${tabName}`], {inheritEnv : true});
	await delay(125);
	await runUtil.run("xdotool", ["key", "--clearmodifiers", "--window", wid, "Return"], {inheritEnv : true});
}

// naughty.notify({ preset = naughty.config.presets.normal, title = "debug message", text = string.format("targetScreenNum %d  s.index %d", targetScreenNum, s.index) })
