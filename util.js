Array.prototype.filterMap = function(fn) {
	var newarray = [];
	for (var item of this) {
		var ret = fn(item);
		if (ret) newarray.push(ret);
	}
	return newarray;
};

Array.prototype.findMap = function(fn) {
	for (var item of this) {
		var ret = fn(item);
		if (ret) return ret;
	}
}

Object.prototype.deepFind = function (fn) {
	return (function crawlObject(object) {
		for (var key in object) {
			var value = object[key];
			if (fn(value)) return value;
			if (typeof value == "object") crawlObject(value);
		}
	})(this);
};

export function stringToBoolean(str) {
	if (str) {
		if (!["0", "false", "off", "no", "null", "undefined", "nan"].includes(str.toLowerCase())) return true;
	}
	return false;
}
