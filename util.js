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


Object.prototype.concatRunsText = function concatRunsText() {
	return this.reduce((str, obj) => str += obj.text, "");
};

export function parseVideoRendererData(data) {
	return {
		id: data.videoId,
		live: Boolean(data.badges?.find(x => x.metadataBadgeRenderer?.style == "BADGE_STYLE_TYPE_LIVE_NOW")),
		title: data.title?.runs?.concatRunsText(),
		description: data.detailedMetadataSnippets?.[0]?.snippetText?.runs?.concatRunsText() 
			|| data.descriptionSnippet?.runs?.concatRunsText(),
		//thumbnailUrl: data.thumbnail?.thumbnails?.find(x => (x.width == 360 && x.height == 202) || (x.width == 246 && x.height == 138))?.url || data.thumbnail?.thumbnails?.[0]?.url,
		//thumbnail: data.thumbnail?.thumbnails?.find(x => (x.width == 360 && x.height == 202) || (x.width == 246 && x.height == 138)) || data.thumbnail?.thumbnails?.[0],
		thumbnail: {
			url: `https://i.ytimg.com/vi/${data.videoId}/mqdefault.jpg`,
			width: 320,
			height: 180
		},
		uploaded: data.publishedTimeText?.simpleText || data.videoInfo?.runs?.[2]?.text,
		lengthText: data.lengthText?.simpleText,
		longLengthText: data.lengthText?.accessibility?.accessibilityData?.label,
		viewCountText: data.viewCountText?.runs ? data.viewCountText.runs.concatRunsText() : data.viewCountText?.simpleText,
		shortViewCountText: data.shortViewCountText?.simpleText || data.videoInfo?.runs?.[0]?.text,
		channel: {
			name: (data.ownerText || data.shortBylineText)?.runs?.concatRunsText(),
			id: (data.ownerText || data.shortBylineText)?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId,
			iconUrl: data.channelThumbnailSupportedRenderers?.channelThumbnailWithLinkRenderer?.thumbnail?.thumbnails?.[0]?.url
		}
	};
}
