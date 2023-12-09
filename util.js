export function stringToBoolean(str) {
	if (str) {
		if (!["0", "false", "off", "no", "null", "undefined", "nan"].includes(str.toLowerCase())) return true;
	}
	return false;
}