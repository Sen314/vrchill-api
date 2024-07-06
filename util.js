import {readFileSync} from "fs";
import got from "got";

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




try {
	var ips = readFileSync("ips.txt", "utf8").trim().split("\n");
	console.log("using ips", ips);
} catch (e) {}

export function gotw(url, options = {}) {
	if (ips) options.localAddress = ips[Math.floor(Math.random() * ips.length)];
	//options.timeout = {request: 3000}; //"RequestError: Expected values which are `number` or `undefined`. Received values of type `Function`." what the fuck?
	return got(url, options);
}