Array.prototype.filterMap = function(fn) {
	var newarray = [];
	for (var item of this) {
		var ret = fn(item);
		if (ret) newarray.push(ret);
	}
	return newarray;
};

export function stringToBoolean(str) {
	if (str) {
		if (!["0", "false", "off", "no", "null", "undefined", "nan"].includes(str.toLowerCase())) return true;
	}
	return false;
}

export function recursiveFind(object, fn) {
	var results = [];
	(function crawlObject(object) {
		for (var key in object) {
			var value = object[key];
			var test = fn(value);
			if (test) results.push(test);
			if (typeof value == "object") crawlObject(value);
		}
	})(object);
	return results;
}
