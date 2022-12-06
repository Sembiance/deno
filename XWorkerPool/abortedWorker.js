import {xu} from "xu";
import {xwork} from "xwork";
import {delay} from "std";

await xwork.openConnection();

await xwork.recv(async ({testid}) =>
{
	let tooLongTimer = null;
	try
	{
		tooLongTimer = setTimeout(async () =>
		{
			tooLongTimer = null;
			console.error(`INWORKER: testid ${testid} took too long (this is expected)`);
			await xwork.send({testid, err : `Took too long to process and was aborted.`});
			xwork.recvAbort();
		}, xu.SECOND*5);	// for some extensions (like macromedia directory, allow a much longer duration timeframe)

		await delay(testid===7 ? xu.DAY : (testid===3 ? xu.SECOND*7 : xu.SECOND*Math.randomInt(1, 3)));
		if(tooLongTimer===null)
			return console.error(`INWORKER: testid ${testid} was cancelled due to taking too long but finished anyways (this is expected)`);

		clearTimeout(tooLongTimer);
		
		await xwork.send({testid});
	}
	catch(err)
	{
		if(tooLongTimer!==null)
			await xwork.send({testid});
		else
			console.log(`INWORKER: testid ${testid} caught ${err} but tooLongTimer was already handleded`);
	}
});

await xwork.closeConnection();
