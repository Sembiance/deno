import {xu} from "xu";

/* converts an formData to an Object */
export function formDataToObject(formData)
{
	const o = {};
	for(const [key] of formData)
	{
		o[key] = formData.getAll(key);
		if(o[key].length===1)
			o[key] = o[key][0];
	}

	return o;
}

