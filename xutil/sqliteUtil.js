import {xu} from "xu";
import {sqlite} from "jsr";

export function createTable(db, tableid, cols, props)
{
	return db.exec(`CREATE TABLE ${tableid} (${Object.entries(cols).map(([k, v]) => `${k} ${v}`).join(", ")}${props ? `, ${props}` : ""})`);
}

export function dropTable(db, tableid)
{
	return db.exec(`DROP TABLE IF EXISTS ${tableid}`);
}

export function open(dbFilePath, opts={})
{
	const db = new sqlite.Database(dbFilePath, {create : false, memory : false, readonly : false, int64 : true, ...opts});
	db.exec("PRAGMA journal_mode=WAL");
	db.exec("PRAGMA synchronous=NORMAL");
	db.exec("PRAGMA temp_store=MEMORY");
	db.exec(`PRAGMA mmap_size=${xu.GB*2}`);
	db.exec(`PRAGMA journal_size_limit=${xu.MB*512}`);

	return db;
}


export function prepare(db, statementRaw)
{
	let statement;
	try
	{
		statement = db.prepare(statementRaw);
	}
	catch(err)
	{
		console.error(`Failed to prepare statement: ${statementRaw}`, err);
		return null;
	}

	const r = {db};
	for(const n of ["all", "get", "run"])
	{
		r[n] = async (...args) =>
		{
			let stmtResult = null;
			await xu.waitUntil(() =>
			{
				//console.log({statement, statementRaw, n, args});
				try
				{
					stmtResult = statement[n](...args);
					//console.log(stmtResult);
				}
				catch(err)
				{
					if(err.toString().includes("database is locked"))
						return false;

					console.error(err, r, n, args);
					stmtResult = err;
					return true;
				}

				return true;
			}, {stopAfter : 200});	// 200 tries is about 100 seconds

			return convertBigInts(stmtResult);
		};
	}

	return r;
}

function convertBigInts(o)
{
	if(Array.isArray(o))
		return o.map(convertBigInts);

	if(!Object.isObject(o))
		return o;

	for(const key of Object.keys(o))
	{
		if(typeof o[key]==="bigint")
			o[key] = Number(o[key]);
	}

	return o;
}
