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


export function parseVideoRendererData(data) {
	data = data.videoRenderer;
	return {
		id: data.videoId,
		live: Boolean(data.badges?.find(x => x.metadataBadgeRenderer?.style == "BADGE_STYLE_TYPE_LIVE_NOW")),
		title: data.title?.runs?.[0]?.text,
		description: data.detailedMetadataSnippets?.[0]?.snippetText?.runs?.reduce((str, obj) => str += obj.text, "") 
			|| data.descriptionSnippet?.runs?.reduce((str, obj) => str += obj.text, ""),
		thumbnailUrl: data.thumbnail?.thumbnails?.find(x => x.width == 360 && x.height == 202)?.url || data.thumbnail?.thumbnails?.[0]?.url,
		uploaded: data.publishedTimeText?.simpleText,
		lengthText: data.lengthText?.simpleText,
		longLengthText: data.lengthText?.accessibility?.accessibilityData?.label,
		viewCountText: data.viewCountText?.runs ? data.viewCountText.runs.reduce((str, obj) => str += obj.text, "") : data.viewCountText?.simpleText,
		shortViewCountText: data.shortViewCountText?.simpleText,
		channel: {
			name: data.ownerText?.runs?.[0]?.text,
			id: data.ownerText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId,
			iconUrl: data.channelThumbnailSupportedRenderers?.channelThumbnailWithLinkRenderer?.thumbnail?.thumbnails?.[0]?.url
		}
	};
}
