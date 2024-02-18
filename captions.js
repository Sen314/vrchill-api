import { XMLParser } from "fast-xml-parser";

var xmlParser = new XMLParser({
	ignoreAttributes: false
});

async function getVideoData(videoId) {
	var html = await fetch(`https://www.youtube.com/watch?v=${videoId}`).then(res => res.text());

	var ytInitialPlayerResponse = html.match(/var ytInitialPlayerResponse = ({.*});/)[1];
	ytInitialPlayerResponse = JSON.parse(ytInitialPlayerResponse);

	return ytInitialPlayerResponse;
}

async function getVideoCaptions(videoId) {
	var ytInitialPlayerResponse = await getVideoData(videoId);
	if (!ytInitialPlayerResponse.captions) return [];
	var captionTracks = ytInitialPlayerResponse.captions.playerCaptionsTracklistRenderer.captionTracks;
	captionTracks = await Promise.all(captionTracks.map(captionTrack => (async () => {
		var xml = await fetch(captionTrack.baseUrl).then(res => res.text());
		var parsed = xmlParser.parse(xml);
		var lines = parsed.transcript.text.map(({ "#text": text, "@_start": start, "@_dur": dur }) => ({ start: Number(start), dur: Number(dur), text }));
		return {
			name: captionTrack.name.simpleText,
			id: captionTrack.vssId,
			lines
		};
	})().catch(error => console.error(error.stack))));
	return captionTracks;
}

var cache = {};

export async function getVideoCaptionsCached(videoId) {
	if (!cache[videoId]) {
		cache[videoId] = getVideoCaptions(videoId);
		setTimeout(() => {
			delete cache[videoId];
		}, 1000*60*60*6); // 6 hours
	}
	return await cache[videoId];
}