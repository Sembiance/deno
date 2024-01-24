import {xu} from "xu";

/* converts an formData to an Object */
export function formDataToObject(formData)
{
	const o = {};
	for(const [key, value] of formData)
		o[key] = value;

	return o;
}

